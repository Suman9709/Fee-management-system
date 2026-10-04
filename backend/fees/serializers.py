from rest_framework import serializers

from .models import ClassFeeStructure, TransportLocation


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
