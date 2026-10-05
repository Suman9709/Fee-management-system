from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from fees.models import ClassFeeStructure, FeeInvoice, TransportLocation
from fees.services import academic_year_for

from .models import Classroom, Student, StudentAttendance


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
        self.class_fee = ClassFeeStructure.objects.create(
            academic_year=academic_year_for(),
            class_name='10',
            monthly_school_fee='1500.00',
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
        invoice = FeeInvoice.objects.get(student=student)
        self.assertEqual(invoice.school_fee_amount, 1500)
        self.assertEqual(invoice.transport_fee_amount, 0)
        self.assertEqual(invoice.total_amount, 1500)

        response = self.client.patch(
            reverse('student-detail', kwargs={'student_id': student.student_id}),
            {'section': 'B'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        student.refresh_from_db()
        self.assertEqual(student.section, 'B')

        response = self.client.delete(
            reverse('student-detail', kwargs={'student_id': student.student_id})
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('fee invoices', response.data['detail'])
        self.assertTrue(Student.objects.filter(pk=student.pk).exists())

    def test_superuser_can_create_a_student(self):
        self.client.force_authenticate(self.admin_user)
        payload = {
            **self.student_payload,
            'student_id': 'stu-2026-00003',
        }

        response = self.client.post(reverse('student-list'), payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['student_id'], 'STU-2026-00003')
        self.assertTrue(Student.objects.filter(student_id='STU-2026-00003').exists())

    def test_student_invoice_includes_selected_transport_fee(self):
        transport_location = TransportLocation.objects.create(
            location_name='Barauni Test Stop',
            monthly_transport_fee='700.00',
        )
        payload = {
            **self.student_payload,
            'student_id': 'stu-2026-00004',
            'transport_location': transport_location.pk,
        }
        self.client.force_authenticate(self.staff_user)

        response = self.client.post(reverse('student-list'), payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        invoice = FeeInvoice.objects.get(student__student_id='STU-2026-00004')
        self.assertEqual(invoice.school_fee_amount, 1500)
        self.assertEqual(invoice.transport_fee_amount, 700)
        self.assertEqual(invoice.total_amount, 2200)

    def test_student_creation_requires_an_active_class_fee(self):
        self.class_fee.delete()
        self.client.force_authenticate(self.staff_user)

        response = self.client.post(reverse('student-list'), self.student_payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('class_name', response.data)
        self.assertFalse(Student.objects.filter(student_id='STU-2026-00001').exists())

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


class StudentDashboardApiTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.staff_user = user_model.objects.create_user(
            username='dashboard-staff',
            password='safe-test-password',
            is_staff=True,
        )
        ClassFeeStructure.objects.create(
            academic_year=academic_year_for(),
            class_name='10',
            monthly_school_fee='1500.00',
        )
        self.student = Student.objects.create_with_user(
            student_id='STU-DASHBOARD-001',
            password='safe-test-password',
            full_name='Dashboard Student',
            date_of_birth='2010-01-01',
            class_name='10',
            section='A',
            parent_name='Dashboard Parent',
            parent_phone='9876543210',
            address='Test Address',
        )
        Classroom.objects.create(
            academic_year=academic_year_for(),
            class_name='10',
            section='A',
            class_teacher='Anita Kumari',
        )
        StudentAttendance.objects.create(
            student=self.student,
            attendance_month='2026-10-01',
            working_days=22,
            days_present=20,
        )
        FeeInvoice.objects.create(
            student=self.student,
            academic_year=academic_year_for(),
            billing_month='2026-10-01',
            school_fee_amount='1500.00',
            transport_fee_amount='0.00',
            total_amount='1500.00',
            due_date='2026-10-10',
            created_by=self.staff_user,
        )

    def test_staff_can_assign_classroom_and_record_attendance(self):
        self.client.force_authenticate(self.staff_user)
        response = self.client.post(
            reverse('classroom-list'),
            {
                'academic_year': academic_year_for(),
                'class_name': '10',
                'section': 'B',
                'class_teacher': 'Rajesh Kumar',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.client.post(
            reverse('student-attendance-list'),
            {
                'student': self.student.pk,
                'attendance_month': '2026-11-01',
                'working_days': 20,
                'days_present': 19,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['attendance_percentage'], 95.0)

    def test_student_dashboard_returns_only_their_profile_data(self):
        self.client.force_authenticate(self.student.user)

        response = self.client.get(reverse('student-dashboard'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['student']['student_id'], 'STU-DASHBOARD-001')
        self.assertEqual(response.data['classroom']['class_teacher'], 'Anita Kumari')
        self.assertEqual(response.data['attendance'][0]['days_present'], 20)
        self.assertEqual(response.data['fee_summary']['total_outstanding'], 1500)
