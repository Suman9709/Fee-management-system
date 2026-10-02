from datetime import date

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase

from student.models import Student

from .models import ClassFeeStructure, FeeInvoice, Payment, TransportLocation


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
