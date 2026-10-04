from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Student


class StudentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Student
        fields = [
            'id',
            'student_id',
            'username',
            'full_name',
            'date_of_birth',
            'email',
            'phone',
            'class_name',
            'section',
            'parent_name',
            'parent_phone',
            'address',
            'transport_location',
            'must_change_password',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'student_id',
            'username',
            'must_change_password',
            'created_at',
            'updated_at',
        ]


class StudentCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    password_confirmation = serializers.CharField(write_only=True, trim_whitespace=False)

    class Meta:
        model = Student
        fields = [
            'student_id',
            'full_name',
            'date_of_birth',
            'email',
            'phone',
            'class_name',
            'section',
            'parent_name',
            'parent_phone',
            'address',
            'transport_location',
            'password',
            'password_confirmation',
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirmation']:
            raise serializers.ValidationError(
                {'password_confirmation': 'Passwords do not match.'}
            )

        validate_password(attrs['password'])
        attrs.pop('password_confirmation')
        return attrs

    def validate_student_id(self, value):
        student_id = value.strip().upper()
        user_model = get_user_model()

        if Student.objects.filter(student_id=student_id).exists():
            raise serializers.ValidationError('A student with this ID already exists.')
        if user_model.objects.filter(username=student_id).exists():
            raise serializers.ValidationError('This student ID is already in use.')

        return student_id

    def validate_class_name(self, value):
        return value.strip()

    def validate_section(self, value):
        return value.strip()

    def validate_transport_location(self, value):
        if value and not value.is_active:
            raise serializers.ValidationError('Select an active transport location.')
        return value


class StudentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = [
            'full_name',
            'date_of_birth',
            'email',
            'phone',
            'class_name',
            'section',
            'parent_name',
            'parent_phone',
            'address',
            'transport_location',
        ]


class StudentPasswordChangeSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    password_confirmation = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirmation']:
            raise serializers.ValidationError(
                {'password_confirmation': 'Passwords do not match.'}
            )

        validate_password(attrs['password'], user=self.context['user'])
        attrs.pop('password_confirmation')
        return attrs
    
    
class StudentPasswordResetSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    password_confirmation = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirmation']:
            raise serializers.ValidationError(
                {'password_confirmation': 'Passwords do not match.'}
            )

        validate_password(attrs['password'])
        attrs.pop('password_confirmation')
        return attrs
