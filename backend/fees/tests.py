from datetime import date

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from student.models import Student

from .models import ClassFeeStructure, FeeInvoice, Payment, TransportLocation
from .services import academic_year_for


class FeeModelTests(TestCase):
    def setUp(self):
        user_model = get_user_model()
        self.staff_user = user_model.objects.create_user(
            username="fee-staff",
            password="safe-test-password",
            is_staff=True,
        )
        self.student = Student.objects.create_with_user(
            student_id="STU-FEE-001",
            password="PermanentPassword123",
            full_name="Fee Student",
            date_of_birth="2010-01-01",
            class_name="10",
            section="A",
            parent_name="Fee Parent",
            parent_phone="9876543210",
            address="Test Address",
        )

    def test_invoice_snapshots_class_and_optional_transport_fees(self):
        class_fee = ClassFeeStructure.objects.create(
            academic_year="2026-27",
            class_name="10",
            monthly_school_fee="2000.00",
        )
        location = TransportLocation.objects.create(
            location_name="Dehradun",
            monthly_transport_fee="800.00",
        )
        self.student.transport_location = location
        self.student.save(update_fields=["transport_location", "updated_at"])

        invoice = FeeInvoice(
            student=self.student,
            academic_year=class_fee.academic_year,
            billing_month=date(2026, 10, 1),
            school_fee_amount=class_fee.monthly_school_fee,
            transport_fee_amount=location.monthly_transport_fee,
            total_amount="2800.00",
            due_date=date(2026, 10, 10),
            created_by=self.staff_user,
        )
        invoice.full_clean()
        invoice.save()

        payment = Payment.objects.create(
            invoice=invoice,
            amount="1000.00",
            payment_date=date(2026, 10, 2),
            method=Payment.Method.UPI,
            received_by=self.staff_user,
        )

        self.assertEqual(invoice.total_amount, 2800)
        self.assertEqual(payment.invoice, invoice)

    def test_invoice_rejects_incorrect_total_or_non_month_start_date(self):
        invalid_invoice = FeeInvoice(
            student=self.student,
            academic_year="2026-27",
            billing_month=date(2026, 10, 2),
            school_fee_amount="2000.00",
            transport_fee_amount="0.00",
            total_amount="2100.00",
            due_date=date(2026, 10, 10),
            created_by=self.staff_user,
        )

        with self.assertRaises(ValidationError):
            invalid_invoice.full_clean()


class FeeConfigurationApiTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.admin_user = user_model.objects.create_superuser(
            username='fee-admin',
            password='safe-test-password',
        )
        self.staff_user = user_model.objects.create_user(
            username='fee-staff-api',
            password='safe-test-password',
            is_staff=True,
        )

    def test_admin_can_configure_class_and_transport_fees(self):
        self.client.force_authenticate(self.staff_user)
        response = self.client.post(
            reverse('class-fee-list'),
            {
                'academic_year': '2026-27',
                'class_name': '10',
                'monthly_school_fee': '1800.00',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.admin_user)
        response = self.client.post(
            reverse('class-fee-list'),
            {
                'academic_year': '2026-27',
                'class_name': '10',
                'monthly_school_fee': '1800.00',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.client.post(
            reverse('transport-location-list'),
            {
                'location_name': 'Barauni Test Stop',
                'monthly_transport_fee': '750.00',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.client.force_authenticate(self.staff_user)
        response = self.client.get(reverse('class-fee-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['class_name'], '10')


class FeeOperationsApiTests(APITestCase):
    """The office-facing invoice and payment workflow stays fully auditable."""

    def setUp(self):
        user_model = get_user_model()
        self.staff_user = user_model.objects.create_user(
            username='collections-staff',
            password='safe-test-password',
            is_staff=True,
        )
        self.billing_month = date(2026, 10, 1)
        self.academic_year = academic_year_for(self.billing_month)
        ClassFeeStructure.objects.create(
            academic_year=self.academic_year,
            class_name='10',
            monthly_school_fee='1500.00',
        )
        self.student = Student.objects.create_with_user(
            student_id='STU-COLLECTION-001',
            password='PermanentPassword123',
            full_name='Collection Student',
            date_of_birth='2010-01-01',
            class_name='10',
            section='A',
            parent_name='Collection Parent',
            parent_phone='9876543210',
            address='Test Address',
        )
        self.client.force_authenticate(self.staff_user)

    def test_staff_can_generate_invoice_and_record_a_full_payment(self):
        response = self.client.post(
            reverse('fee-invoice-list'),
            {'billing_month': self.billing_month.isoformat()},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['created'], 1)
        invoice_id = response.data['invoices'][0]['id']

        response = self.client.post(
            reverse('payment-list'),
            {
                'invoice': invoice_id,
                'amount': '500.00',
                'payment_date': self.billing_month.isoformat(),
                'method': Payment.Method.UPI,
                'reference_number': 'UPI-TEST-1',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.client.post(
            reverse('payment-list'),
            {
                'invoice': invoice_id,
                'amount': '1000.00',
                'payment_date': self.billing_month.isoformat(),
                'method': Payment.Method.CASH,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        invoice = FeeInvoice.objects.get(pk=invoice_id)
        self.assertEqual(invoice.status, FeeInvoice.Status.PAID)
        self.assertEqual(Payment.objects.filter(invoice=invoice).count(), 2)

        response = self.client.post(
            reverse('payment-list'),
            {
                'invoice': invoice_id,
                'amount': '1.00',
                'payment_date': self.billing_month.isoformat(),
                'method': Payment.Method.CASH,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('amount', response.data)

    def test_staff_can_correct_payment_and_invoice_status_is_recalculated(self):
        response = self.client.post(
            reverse('fee-invoice-list'),
            {'billing_month': self.billing_month.isoformat()},
            format='json',
        )
        invoice_id = response.data['invoices'][0]['id']
        first_payment = self.client.post(
            reverse('payment-list'),
            {
                'invoice': invoice_id,
                'amount': '500.00',
                'payment_date': self.billing_month.isoformat(),
                'method': Payment.Method.UPI,
                'reference_number': 'UPI-ORIGINAL',
            },
            format='json',
        )
        self.assertEqual(first_payment.status_code, status.HTTP_201_CREATED)
        self.client.post(
            reverse('payment-list'),
            {
                'invoice': invoice_id,
                'amount': '1000.00',
                'payment_date': self.billing_month.isoformat(),
                'method': Payment.Method.CASH,
            },
            format='json',
        )

        response = self.client.patch(
            reverse('payment-detail', kwargs={'pk': first_payment.data['id']}),
            {
                'amount': '300.00',
                'payment_date': '2026-10-02',
                'method': Payment.Method.CARD,
                'reference_number': 'CARD-CORRECTED',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(str(response.data['amount']), '300.00')
        self.assertEqual(response.data['method'], Payment.Method.CARD)
        self.assertEqual(response.data['updated_by_name'], self.staff_user.username)

        payment = Payment.objects.get(pk=first_payment.data['id'])
        self.assertEqual(payment.audit_logs.count(), 1)
        audit_log = payment.audit_logs.first()
        self.assertEqual(audit_log.previous_amount, 500)
        self.assertEqual(audit_log.new_amount, 300)
        self.assertEqual(audit_log.changed_by, self.staff_user)
        invoice = FeeInvoice.objects.get(pk=invoice_id)
        self.assertEqual(invoice.status, FeeInvoice.Status.PARTIAL)

        response = self.client.patch(
            reverse('payment-detail', kwargs={'pk': payment.pk}),
            {'amount': '501.00'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('amount', response.data)

        self.client.force_authenticate(self.student.user)
        response = self.client.patch(
            reverse('payment-detail', kwargs={'pk': payment.pk}),
            {'amount': '300.00'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_dashboard_and_defaulters_return_live_open_balance(self):
        FeeInvoice.objects.create(
            student=self.student,
            academic_year=self.academic_year,
            billing_month=self.billing_month,
            school_fee_amount='1500.00',
            transport_fee_amount='0.00',
            total_amount='1500.00',
            due_date=date(2026, 10, 10),
            created_by=self.staff_user,
        )

        response = self.client.get(
            f"{reverse('fee-dashboard-list')}?academic_year={self.academic_year}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['summary']['student_count'], 1)
        self.assertEqual(str(response.data['summary']['total_invoiced']), '1500.00')
        self.assertEqual(str(response.data['summary']['total_outstanding']), '1500.00')

        response = self.client.get(
            f"{reverse('fee-invoice-defaulters')}?academic_year={self.academic_year}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['student_id'], self.student.student_id)
