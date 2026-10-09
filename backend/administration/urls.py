from rest_framework.routers import DefaultRouter

from .views import (
    AnnouncementViewSet,
    HolidayViewSet,
    SupportRequestViewSet,
    TimetableEntryViewSet,
)


router = DefaultRouter()
router.register('announcements', AnnouncementViewSet, basename='announcement')
router.register('holidays', HolidayViewSet, basename='holiday')
router.register('timetable', TimetableEntryViewSet, basename='timetable-entry')
router.register('support-requests', SupportRequestViewSet, basename='support-request')

urlpatterns = router.urls
