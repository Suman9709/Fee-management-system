from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework.viewsets import ModelViewSet

from .models import ClassFeeStructure, TransportLocation
from .serializers import ClassFeeStructureSerializer, TransportLocationSerializer


class IsSuperuserOrStaffReadOnly(BasePermission):
    """Staff can select fee settings; only superusers can change them."""

    message = 'Only an administrator can change fee settings.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return bool(request.user.is_staff)
        return bool(request.user.is_superuser)


class ClassFeeStructureViewSet(ModelViewSet):
    serializer_class = ClassFeeStructureSerializer
    permission_classes = [IsSuperuserOrStaffReadOnly]
    queryset = ClassFeeStructure.objects.all()

    def get_queryset(self):
        queryset = ClassFeeStructure.objects.all()
        academic_year = self.request.query_params.get('academic_year')
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)

        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() in ('1', 'true', 'yes'))
        return queryset


class TransportLocationViewSet(ModelViewSet):
    serializer_class = TransportLocationSerializer
    permission_classes = [IsSuperuserOrStaffReadOnly]
    queryset = TransportLocation.objects.all()

    def get_queryset(self):
        queryset = TransportLocation.objects.all()
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() in ('1', 'true', 'yes'))
        return queryset
