from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from student.models import Student


class CookieAuthenticationTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.staff_user = user_model.objects.create_user(
            username='cookie-staff',
            password='safe-test-password',
            is_staff=True,
        )
        self.admin_user = user_model.objects.create_superuser(
            username='cookie-admin',
            password='safe-test-password',
        )

    def csrf_token(self):
        response = self.client.get(reverse('csrf-cookie'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return self.client.cookies['csrftoken'].value

    def test_cookie_login_authentication_refresh_and_logout(self):
        csrf_token = self.csrf_token()

        response = self.client.post(
            reverse('cookie-login'),
            {'username': 'cookie-staff', 'password': 'safe-test-password'},
            format='json',
            HTTP_X_CSRFTOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('access', response.data)
        self.assertNotIn('refresh', response.data)
        self.assertIn('access_token', response.cookies)
        self.assertIn('refresh_token', response.cookies)
        self.assertTrue(response.cookies['access_token']['httponly'])

        response = self.client.get(reverse('student-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.post(
            reverse('cookie-token-refresh'),
            {},
            format='json',
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.cookies)
        self.assertIn('refresh_token', response.cookies)

        response = self.client.post(
            reverse('cookie-logout'),
            {},
            format='json',
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(response.cookies['access_token'].value, '')
        self.assertEqual(response.cookies['refresh_token'].value, '')

    def test_current_user_returns_staff_admin_and_student_roles(self):
        self.client.force_authenticate(self.staff_user)
        response = self.client.get(reverse('current-user'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['authenticated'])
        self.assertEqual(response.data['role'], 'staff')
        self.assertIsNone(response.data['profile'])

        self.client.force_authenticate(self.admin_user)
        response = self.client.get(reverse('current-user'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], 'admin')

        student = Student.objects.create_with_user(
            student_id='STU-2026-00002',
            password='PermanentPassword123',
            full_name='Profile Student',
            date_of_birth='2010-01-01',
            class_name='10',
            section='A',
            parent_name='Profile Parent',
            parent_phone='9876543210',
            address='Profile Address',
        )
        self.client.force_authenticate(student.user)
        response = self.client.get(reverse('current-user'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], 'student')
        self.assertEqual(response.data['profile']['student_id'], 'STU-2026-00002')
