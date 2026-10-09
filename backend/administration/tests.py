from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from student.models import Student

from .models import Announcement, Audience, SupportRequest, TimetableEntry


class SchoolOperationsApiTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.staff_user = user_model.objects.create_user(
            username='operations-staff', password='safe-test-password', is_staff=True
        )
        self.student = Student.objects.create_with_user(
            student_id='STU-OPERATIONS-001',
            password='PermanentPassword123',
            full_name='Operations Student',
            date_of_birth='2010-01-01',
            class_name='10',
            section='A',
            parent_name='Operations Parent',
            parent_phone='9876543210',
            address='Test Address',
        )

    def test_student_only_sees_published_student_announcements(self):
        Announcement.objects.create(
            audience=Audience.STUDENTS,
            title='Student notice',
            message='Visible to students.',
            published_by=self.staff_user,
        )
        Announcement.objects.create(
            audience=Audience.STAFF,
            title='Staff notice',
            message='Not visible to students.',
            published_by=self.staff_user,
        )
        Announcement.objects.create(
            audience=Audience.STUDENTS,
            title='Unpublished notice',
            message='Not visible yet.',
            is_published=False,
            published_by=self.staff_user,
        )

        self.client.force_authenticate(self.student.user)
        response = self.client.get(reverse('announcement-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item['title'] for item in response.data], ['Student notice'])

    def test_student_sees_own_timetable_and_can_create_support_request(self):
        own_entry = TimetableEntry.objects.create(
            academic_year='2026-27',
            class_name='10',
            section='A',
            day_of_week=TimetableEntry.Day.MONDAY,
            start_time='08:30',
            end_time='09:15',
            subject='Mathematics',
            created_by=self.staff_user,
        )
        TimetableEntry.objects.create(
            academic_year='2026-27',
            class_name='10',
            section='B',
            day_of_week=TimetableEntry.Day.MONDAY,
            start_time='08:30',
            end_time='09:15',
            subject='Science',
            created_by=self.staff_user,
        )

        self.client.force_authenticate(self.student.user)
        response = self.client.get(reverse('timetable-entry-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item['id'] for item in response.data], [own_entry.id])

        response = self.client.post(
            reverse('support-request-list'),
            {
                'subject': 'Fee receipt',
                'message': 'Please share my fee receipt.',
                # These values must be ignored for a student-created request.
                'status': SupportRequest.Status.RESOLVED,
                'office_response': 'Forged response',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        request_id = response.data['id']
        self.assertEqual(response.data['status'], SupportRequest.Status.OPEN)
        self.assertEqual(response.data['office_response'], '')

        self.client.force_authenticate(self.staff_user)
        response = self.client.patch(
            reverse('support-request-detail', kwargs={'pk': request_id}),
            {'status': SupportRequest.Status.RESOLVED, 'office_response': 'Receipt is available in the office.'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.client.force_authenticate(self.student.user)
        response = self.client.get(reverse('support-request-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['status'], SupportRequest.Status.RESOLVED)
        self.assertEqual(response.data[0]['office_response'], 'Receipt is available in the office.')
