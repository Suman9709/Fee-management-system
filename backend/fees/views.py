from collections import defaultdict
from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import BasePermission, IsAdminUser, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from student.models import Student

from .models import ClassFeeStructure, FeeInvoice, Payment, TransportLocation
from .serializers import (
    ClassFeeStructureSerializer,
    FeeInvoiceSerializer,
    InvoiceGenerationSerializer,
    PaymentSerializer,
    TransportLocationSerializer,
)
from .services import (
    academic_year_for,
    create_current_month_invoice_for_student,
    mark_overdue_invoices,
    sync_invoice_status,
)


class IsSuperuserOrStaffReadOnly(BasePermission):
    """Staff can select fee settings; only superusers can change them."""

    message = 'Only an administrator can change fee settings.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return bool(request.user.is_staff)
        return bool(request.user.is_superuser)


class ClassFeeStructureViewSet(ModelViewSet):
    serializer_class = ClassFeeStructureSerializer
    permission_classes = [IsSuperuserOrStaffReadOnly]
    queryset = ClassFeeStructure.objects.all()

    def get_queryset(self):
        queryset = ClassFeeStructure.objects.all()
        academic_year = self.request.query_params.get('academic_year')
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)

        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() in ('1', 'true', 'yes'))
        return queryset


class TransportLocationViewSet(ModelViewSet):
    serializer_class = TransportLocationSerializer
    permission_classes = [IsSuperuserOrStaffReadOnly]
    queryset = TransportLocation.objects.all()

    def get_queryset(self):
        queryset = TransportLocation.objects.all()
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() in ('1', 'true', 'yes'))
        return queryset


class FeeInvoiceViewSet(ModelViewSet):
    """Read and generate immutable fee invoices for office users."""

    serializer_class = FeeInvoiceSerializer
    permission_classes = [IsAdminUser]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        mark_overdue_invoices()
        queryset = FeeInvoice.objects.select_related('student').prefetch_related('payments')
        student = self.request.query_params.get('student')
        student_id = self.request.query_params.get('student_id')
        academic_year = self.request.query_params.get('academic_year')
        billing_month = self.request.query_params.get('billing_month')
        status_value = self.request.query_params.get('status')

        if student:
            queryset = queryset.filter(student_id=student)
        if student_id:
            queryset = queryset.filter(student__student_id__iexact=student_id)
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)
        if billing_month:
            queryset = queryset.filter(billing_month=billing_month)
        if status_value:
            queryset = queryset.filter(status=status_value)
        return queryset

    def create(self, request, *args, **kwargs):
        """Generate one month's invoices for all students or a selected group."""
        serializer = InvoiceGenerationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        billing_month = serializer.validated_data['billing_month']
        student_ids = serializer.validated_data.get('student_ids')
        students = Student.objects.all().order_by('student_id')
        if student_ids:
            students = students.filter(pk__in=student_ids)
            if students.count() != len(set(student_ids)):
                raise ValidationError({'student_ids': 'One or more selected students do not exist.'})

        created_count = 0
        updated_count = 0
        invoices = []
        with transaction.atomic():
            for student in students.select_related('transport_location'):
                existed = FeeInvoice.objects.filter(
                    student=student,
                    academic_year=academic_year_for(billing_month),
                    billing_month=billing_month,
                ).exists()
                invoice = create_current_month_invoice_for_student(
                    student,
                    created_by=request.user,
                    on_date=billing_month,
                )
                invoices.append(invoice)
                if existed:
                    updated_count += 1
                else:
                    created_count += 1

        result = FeeInvoice.objects.filter(pk__in=[invoice.pk for invoice in invoices]).select_related(
            'student'
        ).prefetch_related('payments')
        return Response(
            {
                'created': created_count,
                'updated': updated_count,
                'invoices': FeeInvoiceSerializer(result, many=True).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=['get'])
    def defaulters(self, request):
        queryset = self.get_queryset().exclude(
            status__in=[FeeInvoice.Status.PAID, FeeInvoice.Status.CANCELLED]
        ).order_by('due_date', 'student__student_id')
        return Response(self.get_serializer(queryset, many=True).data)


class PaymentViewSet(ModelViewSet):
    """Record fee payments. Payments are append-only financial records."""

    serializer_class = PaymentSerializer
    permission_classes = [IsAdminUser]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        queryset = Payment.objects.select_related('invoice__student', 'received_by')
        invoice = self.request.query_params.get('invoice')
        student = self.request.query_params.get('student')
        if invoice:
            queryset = queryset.filter(invoice_id=invoice)
        if student:
            queryset = queryset.filter(invoice__student_id=student)
        return queryset

    def perform_create(self, serializer):
        with transaction.atomic():
            invoice = FeeInvoice.objects.select_for_update().prefetch_related('payments').get(
                pk=serializer.validated_data['invoice'].pk
            )
            paid_amount = sum((payment.amount for payment in invoice.payments.all()), start=Decimal('0.00'))
            outstanding_amount = invoice.total_amount - paid_amount
            if serializer.validated_data['amount'] > outstanding_amount:
                raise ValidationError(
                    {'amount': f'Payment exceeds the outstanding balance of {outstanding_amount}.'}
                )
            if invoice.status == FeeInvoice.Status.CANCELLED:
                raise ValidationError({'invoice': 'A cancelled invoice cannot receive payments.'})
            payment = serializer.save(received_by=self.request.user, invoice=invoice)
            # Re-query the prefetched relation so the new payment participates in the status calculation.
            invoice = FeeInvoice.objects.prefetch_related('payments').get(pk=invoice.pk)
            sync_invoice_status(invoice)
            return payment


class FeeDashboardViewSet(ModelViewSet):
    """Read-only collection data used by the owner and office dashboards."""

    permission_classes = [IsAdminUser]
    http_method_names = ['get', 'head', 'options']

    def list(self, request, *args, **kwargs):
        mark_overdue_invoices()
        academic_year = request.query_params.get('academic_year')
        if not academic_year:
            academic_year = academic_year_for()

        invoices = list(
            FeeInvoice.objects.filter(academic_year=academic_year)
            .select_related('student')
            .prefetch_related('payments')
        )
        payments = Payment.objects.filter(invoice__academic_year=academic_year).select_related(
            'invoice__student', 'received_by'
        )
        total_invoiced = sum((invoice.total_amount for invoice in invoices), start=Decimal('0.00'))
        total_collected = sum((payment.amount for payment in payments), start=Decimal('0.00'))
        total_outstanding = max(Decimal('0.00'), total_invoiced - total_collected)

        status_counts = defaultdict(int)
        class_summary = defaultdict(lambda: {'invoiced': Decimal('0.00'), 'collected': Decimal('0.00')})
        for invoice in invoices:
            status_counts[invoice.status] += 1
            class_summary[invoice.student.class_name]['invoiced'] += invoice.total_amount
            class_summary[invoice.student.class_name]['collected'] += sum(
                (payment.amount for payment in invoice.payments.all()), start=Decimal('0.00')
            )

        monthly_collection = payments.annotate(month=TruncMonth('payment_date')).values('month').annotate(
            collected=Sum('amount')
        ).order_by('month')
        recent_payments = payments.order_by('-payment_date', '-created_at')[:6]
        student_count = Student.objects.filter(fee_invoices__academic_year=academic_year).distinct().count()

        return Response(
            {
                'academic_year': academic_year,
                'summary': {
                    'student_count': student_count,
                    'invoice_count': len(invoices),
                    'total_invoiced': total_invoiced,
                    'total_collected': total_collected,
                    'total_outstanding': total_outstanding,
                    'collection_rate': (
                        round((total_collected / total_invoiced) * 100, 2)
                        if total_invoiced
                        else Decimal('0.00')
                    ),
                    'paid_count': status_counts[FeeInvoice.Status.PAID],
                    'partial_count': status_counts[FeeInvoice.Status.PARTIAL],
                    'unpaid_count': status_counts[FeeInvoice.Status.UNPAID],
                    'overdue_count': status_counts[FeeInvoice.Status.OVERDUE],
                },
                'monthly_collections': list(monthly_collection),
                'class_collections': [
                    {
                        'class_name': class_name,
                        'invoiced': values['invoiced'],
                        'collected': values['collected'],
                        'collection_rate': (
                            round((values['collected'] / values['invoiced']) * 100, 2)
                            if values['invoiced']
                            else Decimal('0.00')
                        ),
                    }
                    for class_name, values in sorted(class_summary.items())
                ],
                'recent_payments': PaymentSerializer(recent_payments, many=True).data,
            }
        )
