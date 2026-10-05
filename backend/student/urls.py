from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    ClassroomViewSet,
    StudentAttendanceViewSet,
    StudentDashboardView,
    StudentViewSet,
)


router = DefaultRouter()
router.register('students', StudentViewSet, basename='student')
router.register('classrooms', ClassroomViewSet, basename='classroom')
router.register('attendance', StudentAttendanceViewSet, basename='student-attendance')

urlpatterns = [
    path('student-dashboard/', StudentDashboardView.as_view(), name='student-dashboard'),
] + router.urls
