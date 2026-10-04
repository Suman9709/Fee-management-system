from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import BasePermission, IsAdminUser
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from fees.services import create_current_month_invoice_for_student
from fees.models import FeeInvoice

from .models import Student
from .serializers import (
    StudentCreateSerializer,
    StudentPasswordChangeSerializer,
    StudentSerializer,
    StudentUpdateSerializer,
)


class IsSuperuser(BasePermission):
    message = 'Only a superuser can change student passwords.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class StudentViewSet(ModelViewSet):
    """Student management for staff users and superusers only."""

    queryset = Student.objects.select_related('user').order_by('student_id')
    permission_classes = [IsAdminUser]
    lookup_field = 'student_id'

    def get_serializer_class(self):
        if self.action == 'create':
            return StudentCreateSerializer
        if self.action == 'change_password':
            return StudentPasswordChangeSerializer
        if self.action in ('update', 'partial_update'):
            return StudentUpdateSerializer
        return StudentSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                student = Student.objects.create_with_user(**serializer.validated_data)
                create_current_month_invoice_for_student(
                    student,
                    created_by=request.user,
                )
        except DjangoValidationError as error:
            detail = error.message_dict if hasattr(error, 'message_dict') else error.messages
            return Response(detail, status=status.HTTP_400_BAD_REQUEST)

        response_data = StudentSerializer(student, context=self.get_serializer_context()).data
        headers = self.get_success_headers(response_data)
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

    def get_permissions(self):
        if self.action == 'change_password':
            return [IsSuperuser()]
        return super().get_permissions()

    @action(detail=True, methods=['post'], url_path='change-password')
    def change_password(self, request, student_id=None):
        student = self.get_object()
        serializer = self.get_serializer(
            data=request.data,
            context={'user': student.user},
        )
        serializer.is_valid(raise_exception=True)

        student.user.set_password(serializer.validated_data['password'])
        student.user.save(update_fields=['password'])
        student.must_change_password = False
        student.save(update_fields=['must_change_password', 'updated_at'])

        return Response({'detail': 'Student password changed successfully.'})

    def perform_destroy(self, instance):
        if FeeInvoice.objects.filter(student=instance).exists():
            raise DRFValidationError(
                {
                    'detail': (
                        'This student has fee invoices and cannot be deleted. '
                        'Keep the financial record instead.'
                    )
                }
            )

        # Deleting the linked user also removes its one-to-one student profile.
        with transaction.atomic():
            instance.user.delete()
