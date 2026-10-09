from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError as DRFValidationError
from rest_framework.permissions import BasePermission, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from fees.invoice_document import render_invoice_pdf
from fees.models import FeeInvoice
from fees.services import create_current_month_invoice_for_student, mark_overdue_invoices

from .models import Classroom, Guardian, Student, StudentAttendance
from .serializers import (
    ClassroomSerializer,
    GuardianCreateSerializer,
    GuardianSerializer,
    StudentCreateSerializer,
    StudentAttendanceSerializer,
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

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        fee_fields_changed = bool(
            {'class_name', 'transport_location'} & set(serializer.validated_data)
        )

        try:
            with transaction.atomic():
                student = serializer.save()
                if fee_fields_changed:
                    create_current_month_invoice_for_student(
                        student,
                        created_by=request.user,
                    )
        except DjangoValidationError as error:
            detail = error.message_dict if hasattr(error, 'message_dict') else error.messages
            return Response(detail, status=status.HTTP_400_BAD_REQUEST)

        return Response(StudentSerializer(student, context=self.get_serializer_context()).data)

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


class GuardianViewSet(ModelViewSet):
    """Office staff create and manage parent accounts and their children."""

    queryset = Guardian.objects.select_related('user').prefetch_related('students__user')
    permission_classes = [IsAdminUser]

    def get_serializer_class(self):
        if self.action == 'create':
            return GuardianCreateSerializer
        return GuardianSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        students = data.pop('students')
        email = data.pop('email', '')
        username = data.pop('username')
        password = data.pop('password')

        with transaction.atomic():
            user = get_user_model().objects.create_user(
                username=username,
                email=email,
                password=password,
            )
            guardian = Guardian.objects.create(user=user, **data)
            guardian.students.set(students)

        return Response(
            GuardianSerializer(guardian, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
        )


class ClassroomViewSet(ModelViewSet):
    """Staff manage class sections and their class teacher."""

    queryset = Classroom.objects.all()
    serializer_class = ClassroomSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = Classroom.objects.all()
        academic_year = self.request.query_params.get('academic_year')
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)
        return queryset


class StudentAttendanceViewSet(ModelViewSet):
    """Staff record the monthly attendance summary for each student."""

    queryset = StudentAttendance.objects.select_related('student')
    serializer_class = StudentAttendanceSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = StudentAttendance.objects.select_related('student')
        student_id = self.request.query_params.get('student')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        return queryset


class StudentDashboardView(APIView):
    """Return only the authenticated student's academic and fee information."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            student = request.user.student_profile
        except Student.DoesNotExist:
            raise PermissionDenied('This dashboard is available to student accounts only.')

        mark_overdue_invoices()

        classroom = Classroom.objects.filter(
            class_name=student.class_name,
            section=student.section,
            is_active=True,
        ).order_by('-academic_year').first()
        attendance = StudentAttendance.objects.filter(student=student)[:6]
        invoices = FeeInvoice.objects.filter(student=student).prefetch_related('payments')[:12]

        invoice_data = []
        total_outstanding = 0
        for invoice in invoices:
            payments = list(invoice.payments.all())
            paid_amount = sum(payment.amount for payment in payments)
            outstanding_amount = invoice.total_amount - paid_amount
            total_outstanding += outstanding_amount
            invoice_data.append(
                {
                    'id': invoice.id,
                    'academic_year': invoice.academic_year,
                    'billing_month': invoice.billing_month,
                    'school_fee_amount': invoice.school_fee_amount,
                    'transport_fee_amount': invoice.transport_fee_amount,
                    'total_amount': invoice.total_amount,
                    'paid_amount': paid_amount,
                    'outstanding_amount': outstanding_amount,
                    'latest_payment_date': payments[0].payment_date if payments else None,
                    'payments': [
                        {
                            'id': payment.id,
                            'amount': payment.amount,
                            'payment_date': payment.payment_date,
                            'method': payment.method,
                            'reference_number': payment.reference_number,
                        }
                        for payment in payments
                    ],
                    'due_date': invoice.due_date,
                    'status': invoice.status,
                }
            )

        return Response(
            {
                'student': StudentSerializer(student).data,
                'classroom': (
                    {
                        'academic_year': classroom.academic_year,
                        'class_name': classroom.class_name,
                        'section': classroom.section,
                        'class_teacher': classroom.class_teacher,
                    }
                    if classroom
                    else None
                ),
                'attendance': StudentAttendanceSerializer(attendance, many=True).data,
                'invoices': invoice_data,
                'fee_summary': {'total_outstanding': total_outstanding},
            }
        )


class GuardianDashboardView(APIView):
    """Return all academic and fee data for the guardian's linked children."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            guardian = request.user.guardian_profile
        except AttributeError:
            raise PermissionDenied('This dashboard is available to guardian accounts only.')

        mark_overdue_invoices()
        children = []
        for student in guardian.students.select_related('user', 'transport_location').all():
            classroom = Classroom.objects.filter(
                class_name=student.class_name,
                section=student.section,
                is_active=True,
            ).order_by('-academic_year').first()
            attendance = StudentAttendance.objects.filter(student=student)[:6]
            invoices = FeeInvoice.objects.filter(student=student).prefetch_related('payments')[:12]
            invoice_data = []
            total_outstanding = 0
            for invoice in invoices:
                payments = list(invoice.payments.all())
                paid_amount = sum(payment.amount for payment in payments)
                outstanding_amount = invoice.total_amount - paid_amount
                total_outstanding += outstanding_amount
                invoice_data.append(
                    {
                        'id': invoice.id,
                        'academic_year': invoice.academic_year,
                        'billing_month': invoice.billing_month,
                        'school_fee_amount': invoice.school_fee_amount,
                        'transport_fee_amount': invoice.transport_fee_amount,
                        'total_amount': invoice.total_amount,
                        'paid_amount': paid_amount,
                        'outstanding_amount': outstanding_amount,
                        'latest_payment_date': payments[0].payment_date if payments else None,
                        'payments': [
                            {
                                'id': payment.id,
                                'amount': payment.amount,
                                'payment_date': payment.payment_date,
                                'method': payment.method,
                                'reference_number': payment.reference_number,
                            }
                            for payment in payments
                        ],
                        'due_date': invoice.due_date,
                        'status': invoice.status,
                    }
                )
            children.append(
                {
                    'student': StudentSerializer(student).data,
                    'classroom': (
                        {
                            'academic_year': classroom.academic_year,
                            'class_name': classroom.class_name,
                            'section': classroom.section,
                            'class_teacher': classroom.class_teacher,
                        }
                        if classroom
                        else None
                    ),
                    'attendance': StudentAttendanceSerializer(attendance, many=True).data,
                    'invoices': invoice_data,
                    'fee_summary': {'total_outstanding': total_outstanding},
                }
            )

        return Response({'guardian': GuardianSerializer(guardian).data, 'children': children})


class InvoiceDownloadView(APIView):
    """Download a PDF invoice when it belongs to the signed-in family."""

    permission_classes = [IsAuthenticated]

    def get(self, request, invoice_id):
        invoice = get_object_or_404(
            FeeInvoice.objects.select_related('student').prefetch_related('payments'), pk=invoice_id
        )
        can_access = request.user.is_staff
        if not can_access:
            try:
                can_access = request.user.student_profile.pk == invoice.student_id
            except Student.DoesNotExist:
                pass
        if not can_access:
            try:
                can_access = request.user.guardian_profile.students.filter(pk=invoice.student_id).exists()
            except Guardian.DoesNotExist:
                pass
        if not can_access:
            raise PermissionDenied('You cannot download this invoice.')

        response = HttpResponse(render_invoice_pdf(invoice), content_type='application/pdf')
        filename = f'fee-invoice-{invoice.student.student_id}-{invoice.billing_month:%Y-%m}.pdf'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
