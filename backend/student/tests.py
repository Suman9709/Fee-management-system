from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Student


class StudentManagementApiTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.staff_user = user_model.objects.create_user(
            username='staff-user',
            password='staff-password',
            is_staff=True,
        )
        self.admin_user = user_model.objects.create_superuser(
            username='admin-user',
            password='admin-password',
        )
        self.regular_user = user_model.objects.create_user(
            username='regular-user',
            password='regular-password',
        )
        self.student_payload = {
            'student_id': 'stu-2026-00001',
            'full_name': 'Test Student',
            'date_of_birth': '2010-01-01',
            'email': 'student@example.com',
            'phone': '9876543210',
            'class_name': '10',
            'section': 'A',
            'parent_name': 'Test Parent',
            'parent_phone': '9876543211',
            'address': 'Test Address',
            'password': 'PermanentPassword123',
            'password_confirmation': 'PermanentPassword123',
        }

    def test_staff_can_create_and_update_a_student(self):
        self.client.force_authenticate(self.staff_user)

        response = self.client.post(
            reverse('student-list'),
            self.student_payload,
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['student_id'], 'STU-2026-00001')
        self.assertNotIn('password', response.data)
        self.assertNotIn('temporary_password', response.data)

        student = Student.objects.get(student_id='STU-2026-00001')
        self.assertEqual(student.user.username, 'STU-2026-00001')
        self.assertTrue(student.user.check_password('PermanentPassword123'))
        self.assertFalse(student.must_change_password)

        response = self.client.patch(
            reverse('student-detail', kwargs={'student_id': student.student_id}),
            {'section': 'B'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        student.refresh_from_db()
        self.assertEqual(student.section, 'B')

        user_id = student.user_id
        response = self.client.delete(
            reverse('student-detail', kwargs={'student_id': student.student_id})
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Student.objects.filter(pk=student.pk).exists())
        self.assertFalse(get_user_model().objects.filter(pk=user_id).exists())

    def test_only_superuser_can_change_a_student_password(self):
        student = Student.objects.create_with_user(
            student_id='STU-2026-00002',
            password='PermanentPassword123',
            full_name='Password Student',
            date_of_birth='2010-01-01',
            class_name='10',
            section='A',
            parent_name='Password Parent',
            parent_phone='9876543210',
            address='Password Address',
        )
        password_data = {
            'password': 'NewPermanentPassword123',
            'password_confirmation': 'NewPermanentPassword123',
        }
        url = reverse('student-change-password', kwargs={'student_id': student.student_id})

        self.client.force_authenticate(self.staff_user)
        response = self.client.post(url, password_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.admin_user)
        response = self.client.post(url, password_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        student.user.refresh_from_db()
        self.assertTrue(student.user.check_password('NewPermanentPassword123'))

    def test_regular_user_cannot_manage_students(self):
        self.client.force_authenticate(self.regular_user)

        response = self.client.post(
            reverse('student-list'),
            self.student_payload,
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
