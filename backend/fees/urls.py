from rest_framework.routers import DefaultRouter

from .views import (
    ClassFeeStructureViewSet,
    FeeDashboardViewSet,
    FeeInvoiceViewSet,
    PaymentViewSet,
    TransportLocationViewSet,
)


router = DefaultRouter()
router.register('class-fees', ClassFeeStructureViewSet, basename='class-fee')
router.register('transport-locations', TransportLocationViewSet, basename='transport-location')
router.register('invoices', FeeInvoiceViewSet, basename='fee-invoice')
router.register('payments', PaymentViewSet, basename='payment')
router.register('dashboard', FeeDashboardViewSet, basename='fee-dashboard')

urlpatterns = router.urls
