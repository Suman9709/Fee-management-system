from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    ClassroomViewSet,
    GuardianViewSet,
    GuardianDashboardView,
    StudentAttendanceViewSet,
    StudentDashboardView,
    StudentViewSet,
    InvoiceDownloadView,
)


router = DefaultRouter()
router.register('students', StudentViewSet, basename='student')
router.register('guardians', GuardianViewSet, basename='guardian')
router.register('classrooms', ClassroomViewSet, basename='classroom')
router.register('attendance', StudentAttendanceViewSet, basename='student-attendance')

urlpatterns = [
    path('student-dashboard/', StudentDashboardView.as_view(), name='student-dashboard'),
    path('parent-dashboard/', GuardianDashboardView.as_view(), name='parent-dashboard'),
    path('invoices/<int:invoice_id>/download/', InvoiceDownloadView.as_view(), name='invoice-download'),
] + router.urls
