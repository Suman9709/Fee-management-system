from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models


class ClassFeeStructure(models.Model):
    """The monthly school fee for a class in an academic year."""

    academic_year = models.CharField(max_length=20)
    class_name = models.CharField(max_length=50)
    monthly_school_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["academic_year", "class_name"],
                name="unique_class_fee_per_year",
            ),
        ]
        ordering = ["academic_year", "class_name"]

    def __str__(self):
        return f"{self.academic_year} - Class {self.class_name}"


class TransportLocation(models.Model):
    """An optional student transport pickup/drop-off location and its monthly fee."""

    location_name = models.CharField(max_length=100, unique=True)
    monthly_transport_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["location_name"]

    def __str__(self):
        return self.location_name


class FeeInvoice(models.Model):
    class Status(models.TextChoices):
        UNPAID = "unpaid", "Unpaid"
        PARTIAL = "partial", "Partially paid"
        PAID = "paid", "Paid"
        OVERDUE = "overdue", "Overdue"
        CANCELLED = "cancelled", "Cancelled"

    student = models.ForeignKey(
        "student.Student",
        on_delete=models.PROTECT,
        related_name="fee_invoices",
    )
    academic_year = models.CharField(max_length=20)
    # Always store the first day of the billed month, for example 2026-10-01.
    billing_month = models.DateField()
    school_fee_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    transport_fee_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    due_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.UNPAID,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_fee_invoices",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["student", "academic_year", "billing_month"],
                name="one_invoice_per_student_per_month",
            ),
        ]
        ordering = ["-billing_month", "student__student_id"]

    def clean(self):
        super().clean()

        if self.billing_month and self.billing_month.day != 1:
            raise ValidationError({"billing_month": "Use the first day of the billing month."})

        if (
            self.school_fee_amount is not None
            and self.transport_fee_amount is not None
            and self.total_amount is not None
            and self.total_amount != self.school_fee_amount + self.transport_fee_amount
        ):
            raise ValidationError(
                {"total_amount": "Total must equal school fee plus transport fee."}
            )

    def __str__(self):
        return f"{self.student.student_id} - {self.billing_month:%b %Y}"


class Payment(models.Model):
    class Method(models.TextChoices):
        CASH = "cash", "Cash"
        CARD = "card", "Card"
        BANK_TRANSFER = "bank_transfer", "Bank transfer"
        UPI = "upi", "UPI"

    invoice = models.ForeignKey(
        FeeInvoice,
        on_delete=models.PROTECT,
        related_name="payments",
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    payment_date = models.DateField()
    method = models.CharField(max_length=20, choices=Method.choices)
    reference_number = models.CharField(max_length=100, blank=True)
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="received_payments",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-payment_date", "-created_at"]

    def __str__(self):
        return f"Payment #{self.pk} for invoice #{self.invoice_id}"