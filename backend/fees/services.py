from calendar import monthrange
from datetime import date

from django.core.exceptions import ValidationError
from django.utils import timezone

from .models import ClassFeeStructure, FeeInvoice


def academic_year_for(on_date=None):
    """Return the April-to-March academic year containing ``on_date``."""
    on_date = on_date or timezone.localdate()
    start_year = on_date.year if on_date.month >= 4 else on_date.year - 1
    return f'{start_year}-{str(start_year + 1)[-2:]}'


def create_current_month_invoice_for_student(student, *, created_by, on_date=None):
    """Create one current-month invoice using the student's active fee settings.

    Invoice amounts are copied from the configured class and transport fees so
    later fee changes do not rewrite a bill that has already been issued.
    """
    on_date = on_date or timezone.localdate()
    academic_year = academic_year_for(on_date)
    class_fee = ClassFeeStructure.objects.filter(
        academic_year=academic_year,
        class_name__iexact=student.class_name,
        is_active=True,
    ).first()
    if not class_fee:
        raise ValidationError(
            {
                'class_name': (
                    f'No active fee structure is configured for class '
                    f'"{student.class_name}" in {academic_year}. '
                    'Ask an administrator to configure it before creating the student.'
                )
            }
        )

    transport_location = student.transport_location
    if transport_location and not transport_location.is_active:
        raise ValidationError(
            {'transport_location': 'The selected transport location is inactive.'}
        )

    transport_fee = (
        transport_location.monthly_transport_fee if transport_location else 0
    )
    billing_month = on_date.replace(day=1)
    due_date = on_date.replace(day=min(10, monthrange(on_date.year, on_date.month)[1]))

    invoice, _ = FeeInvoice.objects.get_or_create(
        student=student,
        academic_year=academic_year,
        billing_month=billing_month,
        defaults={
            'school_fee_amount': class_fee.monthly_school_fee,
            'transport_fee_amount': transport_fee,
            'total_amount': class_fee.monthly_school_fee + transport_fee,
            'due_date': due_date,
            'created_by': created_by,
        },
    )
    return invoice
