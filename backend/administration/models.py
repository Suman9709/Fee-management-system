from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Audience(models.TextChoices):
    STUDENTS = 'students', 'Students'
    STAFF = 'staff', 'Staff'
    EVERYONE = 'everyone', 'Students and staff'


class Announcement(models.Model):
    """A published in-app notice for students, staff, or both."""

    audience = models.CharField(max_length=20, choices=Audience.choices, default=Audience.EVERYONE)
    title = models.CharField(max_length=160)
    message = models.TextField()
    is_published = models.BooleanField(default=True)
    published_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='published_announcements',
    )
    published_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-published_at']

    def __str__(self):
        return self.title


class Holiday(models.Model):
    """An official holiday range displayed in the portals."""

    audience = models.CharField(max_length=20, choices=Audience.choices, default=Audience.EVERYONE)
    name = models.CharField(max_length=120)
    start_date = models.DateField()
    end_date = models.DateField()
    is_published = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='created_holidays',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_date', 'name']

    def clean(self):
        super().clean()
        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValidationError({'end_date': 'The end date cannot be before the start date.'})

    def __str__(self):
        return self.name


class TimetableEntry(models.Model):
    class Day(models.IntegerChoices):
        MONDAY = 1, 'Monday'
        TUESDAY = 2, 'Tuesday'
        WEDNESDAY = 3, 'Wednesday'
        THURSDAY = 4, 'Thursday'
        FRIDAY = 5, 'Friday'
        SATURDAY = 6, 'Saturday'

    academic_year = models.CharField(max_length=20)
    class_name = models.CharField(max_length=50)
    section = models.CharField(max_length=10)
    day_of_week = models.PositiveSmallIntegerField(choices=Day.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()
    subject = models.CharField(max_length=100)
    room = models.CharField(max_length=80, blank=True)
    teacher_name = models.CharField(max_length=100, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='created_timetable_entries',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['academic_year', 'class_name', 'section', 'day_of_week', 'start_time'],
                name='one_class_timetable_entry_per_timeslot',
            ),
        ]
        ordering = ['day_of_week', 'start_time']

    def clean(self):
        super().clean()
        if self.start_time and self.end_time and self.end_time <= self.start_time:
            raise ValidationError({'end_time': 'The end time must be after the start time.'})

    def __str__(self):
        return f'{self.class_name}-{self.section}: {self.subject}'


class SupportRequest(models.Model):
    class Status(models.TextChoices):
        OPEN = 'open', 'Open'
        IN_PROGRESS = 'in_progress', 'In progress'
        RESOLVED = 'resolved', 'Resolved'

    student = models.ForeignKey(
        'student.Student',
        on_delete=models.CASCADE,
        related_name='support_requests',
    )
    subject = models.CharField(max_length=160)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    office_response = models.TextField(blank=True)
    responded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name='responded_support_requests',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.student.student_id}: {self.subject}'
