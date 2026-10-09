from decimal import Decimal

from rest_framework import serializers

from .models import ClassFeeStructure, FeeInvoice, Payment, TransportLocation
from .services import invoice_paid_amount


class ClassFeeStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassFeeStructure
        fields = [
            'id',
            'academic_year',
            'class_name',
            'monthly_school_fee',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_academic_year(self, value):
        return value.strip()

    def validate_class_name(self, value):
        return value.strip()

    def validate(self, attrs):
        academic_year = attrs.get('academic_year', getattr(self.instance, 'academic_year', ''))
        class_name = attrs.get('class_name', getattr(self.instance, 'class_name', ''))
        existing = ClassFeeStructure.objects.filter(
            academic_year=academic_year,
            class_name__iexact=class_name,
        )
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)

        if existing.exists():
            raise serializers.ValidationError(
                {'class_name': 'A fee structure already exists for this class and academic year.'}
            )
        return attrs


class TransportLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransportLocation
        fields = [
            'id',
            'location_name',
            'monthly_transport_fee',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_location_name(self, value):
        return value.strip()

    def validate(self, attrs):
        location_name = attrs.get('location_name', getattr(self.instance, 'location_name', ''))
        existing = TransportLocation.objects.filter(location_name__iexact=location_name)
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)

        if existing.exists():
            raise serializers.ValidationError(
                {'location_name': 'A transport location with this name already exists.'}
            )
        return attrs


class FeeInvoiceSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    class_name = serializers.CharField(source='student.class_name', read_only=True)
    section = serializers.CharField(source='student.section', read_only=True)
    paid_amount = serializers.SerializerMethodField()
    outstanding_amount = serializers.SerializerMethodField()
    payment_count = serializers.SerializerMethodField()

    class Meta:
        model = FeeInvoice
        fields = [
            'id',
            'student',
            'student_id',
            'student_name',
            'class_name',
            'section',
            'academic_year',
            'billing_month',
            'school_fee_amount',
            'transport_fee_amount',
            'total_amount',
            'paid_amount',
            'outstanding_amount',
            'payment_count',
            'due_date',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields

    def get_paid_amount(self, invoice):
        return invoice_paid_amount(invoice)

    def get_outstanding_amount(self, invoice):
        return max(Decimal('0.00'), invoice.total_amount - invoice_paid_amount(invoice))

    def get_payment_count(self, invoice):
        return len(invoice.payments.all())


class InvoiceGenerationSerializer(serializers.Serializer):
    billing_month = serializers.DateField()
    student_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=False,
        allow_empty=False,
    )

    def validate_billing_month(self, value):
        if value.day != 1:
            raise serializers.ValidationError('Use the first day of the billing month.')
        return value


class PaymentSerializer(serializers.ModelSerializer):
    invoice_student_id = serializers.CharField(source='invoice.student.student_id', read_only=True)
    invoice_student_name = serializers.CharField(source='invoice.student.full_name', read_only=True)
    invoice_billing_month = serializers.DateField(source='invoice.billing_month', read_only=True)
    received_by_name = serializers.CharField(source='received_by.username', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id',
            'invoice',
            'invoice_student_id',
            'invoice_student_name',
            'invoice_billing_month',
            'amount',
            'payment_date',
            'method',
            'reference_number',
            'received_by',
            'received_by_name',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'invoice_student_id',
            'invoice_student_name',
            'invoice_billing_month',
            'received_by',
            'received_by_name',
            'created_at',
        ]

    def validate(self, attrs):
        invoice = attrs['invoice']
        if invoice.status == FeeInvoice.Status.CANCELLED:
            raise serializers.ValidationError({'invoice': 'A cancelled invoice cannot receive payments.'})

        paid_amount = invoice_paid_amount(invoice)
        outstanding_amount = invoice.total_amount - paid_amount
        if attrs['amount'] > outstanding_amount:
            raise serializers.ValidationError(
                {'amount': f'Payment exceeds the outstanding balance of {outstanding_amount}.'}
            )
        return attrs
