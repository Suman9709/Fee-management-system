from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from django.db import models, transaction


class StudentManager(models.Manager):
    def create_with_user(self, *, student_id, password, **student_details):
        """Create a student and its Django login account together.

        ``password`` is securely hashed by Django and is never saved on the
        student profile as plain text.
        """
        student_id = student_id.strip().upper()
        user_model = get_user_model()

        with transaction.atomic(using=self.db):
            user = user_model._default_manager.db_manager(self.db).create_user(
                username=student_id,
                password=password,
            )
            student = self.model(
                user=user,
                student_id=student_id,
                must_change_password=False,
                **student_details,
            )
            student.full_clean()
            student.save(using=self.db)

        return student


class Student(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_profile',
    )
    student_id = models.CharField(max_length=20, unique=True)
    full_name = models.CharField(max_length=100)
    class_name = models.CharField(max_length=50)
    section = models.CharField(max_length=10)
    parent_name = models.CharField(max_length=100)
    parent_phone = models.CharField(max_length=15)
    address = models.TextField()
    
    date_of_birth = models.DateField()
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=15, blank=True)
    
    # No selected location means the student does not use the optional service.
    transport_location = models.ForeignKey(
        'fees.TransportLocation',
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name='students',
    )
    must_change_password = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = StudentManager()

    def __str__(self):
        return f'{self.student_id} - {self.full_name}'


class Guardian(models.Model):
    """A parent/guardian login that can be linked to one or more students."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='guardian_profile',
    )
    full_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    students = models.ManyToManyField(Student, related_name='guardians', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['full_name']

    def __str__(self):
        return self.full_name


class Classroom(models.Model):
    """A class-and-section assignment managed by office staff."""

    academic_year = models.CharField(max_length=20)
    class_name = models.CharField(max_length=50)
    section = models.CharField(max_length=10)
    class_teacher = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['academic_year', 'class_name', 'section'],
                name='unique_classroom_per_academic_year',
            ),
        ]
        ordering = ['academic_year', 'class_name', 'section']

    def __str__(self):
        return f'{self.academic_year} - {self.class_name}-{self.section}'


class StudentAttendance(models.Model):
    """One monthly attendance summary for a student."""

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='attendance_records',
    )
    attendance_month = models.DateField(
        help_text='Use the first day of the month, for example 2026-10-01.',
    )
    working_days = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])
    days_present = models.PositiveSmallIntegerField(validators=[MinValueValidator(0)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'attendance_month'],
                name='one_attendance_record_per_student_month',
            ),
        ]
        ordering = ['-attendance_month']

    @property
    def attendance_percentage(self):
        return round((self.days_present / self.working_days) * 100, 2)

    def clean(self):
        super().clean()
        if self.attendance_month and self.attendance_month.day != 1:
            from django.core.exceptions import ValidationError

            raise ValidationError({'attendance_month': 'Use the first day of the month.'})
        if self.days_present > self.working_days:
            from django.core.exceptions import ValidationError

            raise ValidationError(
                {'days_present': 'Days present cannot be greater than working days.'}
            )

    def __str__(self):
        return f'{self.student.student_id} - {self.attendance_month:%b %Y}'
    
    
