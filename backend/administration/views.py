from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import BasePermission, IsAuthenticated, SAFE_METHODS
from rest_framework.viewsets import ModelViewSet

from .models import Announcement, Audience, Holiday, SupportRequest, TimetableEntry
from .serializers import (
    AnnouncementSerializer,
    HolidaySerializer,
    SupportRequestSerializer,
    TimetableEntrySerializer,
)


class IsStaffOrReadOnly(BasePermission):
    message = 'Only office staff can change school operations data.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.method in SAFE_METHODS or request.user.is_staff


def student_profile_for(user):
    try:
        return user.student_profile
    except AttributeError:
        return None


def guardian_profile_for(user):
    try:
        return user.guardian_profile
    except AttributeError:
        return None


class AnnouncementViewSet(ModelViewSet):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsStaffOrReadOnly]

    def get_queryset(self):
        queryset = Announcement.objects.select_related('published_by')
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(
            is_published=True,
            audience__in=[Audience.STUDENTS, Audience.EVERYONE],
        )

    def perform_create(self, serializer):
        serializer.save(published_by=self.request.user)


class HolidayViewSet(ModelViewSet):
    serializer_class = HolidaySerializer
    permission_classes = [IsStaffOrReadOnly]

    def get_queryset(self):
        queryset = Holiday.objects.select_related('created_by')
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(
            is_published=True,
            audience__in=[Audience.STUDENTS, Audience.EVERYONE],
        )

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class TimetableEntryViewSet(ModelViewSet):
    serializer_class = TimetableEntrySerializer
    permission_classes = [IsStaffOrReadOnly]

    def get_queryset(self):
        queryset = TimetableEntry.objects.select_related('created_by')
        academic_year = self.request.query_params.get('academic_year')
        class_name = self.request.query_params.get('class_name')
        section = self.request.query_params.get('section')
        if self.request.user.is_staff:
            if academic_year:
                queryset = queryset.filter(academic_year=academic_year)
            if class_name:
                queryset = queryset.filter(class_name__iexact=class_name)
            if section:
                queryset = queryset.filter(section__iexact=section)
            return queryset

        student = student_profile_for(self.request.user)
        if student:
            return queryset.filter(class_name__iexact=student.class_name, section__iexact=student.section)
        guardian = guardian_profile_for(self.request.user)
        if guardian:
            student_ids = guardian.students.values_list('class_name', 'section')
            from django.db.models import Q

            class_filter = Q()
            for class_name_value, section_value in student_ids:
                class_filter |= Q(
                    class_name__iexact=class_name_value,
                    section__iexact=section_value,
                )
            return queryset.filter(class_filter) if class_filter else queryset.none()
        return queryset.none()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class SupportRequestViewSet(ModelViewSet):
    serializer_class = SupportRequestSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        queryset = SupportRequest.objects.select_related('student', 'responded_by')
        if self.request.user.is_staff:
            status_value = self.request.query_params.get('status')
            if status_value:
                queryset = queryset.filter(status=status_value)
            return queryset
        student = student_profile_for(self.request.user)
        if student:
            return queryset.filter(student=student)
        guardian = guardian_profile_for(self.request.user)
        return queryset.filter(student__guardians=guardian) if guardian else queryset.none()

    def perform_create(self, serializer):
        student = student_profile_for(self.request.user)
        guardian = guardian_profile_for(self.request.user)
        if not student and guardian:
            student = guardian.students.order_by('student_id').first()
        if not student:
            raise PermissionDenied('Only student or guardian portal accounts can create support requests.')
        # Students can open a request but cannot mark it resolved or add an
        # office response through crafted request data.
        serializer.save(
            student=student,
            status=SupportRequest.Status.OPEN,
            office_response='',
        )

    def partial_update(self, request, *args, **kwargs):
        if not request.user.is_staff:
            raise PermissionDenied('Only office staff can update support requests.')
        return super().partial_update(request, *args, **kwargs)

    def perform_update(self, serializer):
        serializer.save(responded_by=self.request.user)
