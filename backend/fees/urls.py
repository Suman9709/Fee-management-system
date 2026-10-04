from rest_framework.routers import DefaultRouter

from .views import ClassFeeStructureViewSet, TransportLocationViewSet


router = DefaultRouter()
router.register('class-fees', ClassFeeStructureViewSet, basename='class-fee')
router.register('transport-locations', TransportLocationViewSet, basename='transport-location')

urlpatterns = router.urls
