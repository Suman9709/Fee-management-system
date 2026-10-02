from django.conf import settings
from django.contrib.auth import get_user_model
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
    
    
