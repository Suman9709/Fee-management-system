from django.conf import settings
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from student.serializers import GuardianSerializer, StudentSerializer


def _set_auth_cookies(response, access_token, refresh_token=None):
    response.set_cookie(
        settings.JWT_ACCESS_COOKIE,
        access_token,
        max_age=int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()),
        httponly=True,
        secure=settings.JWT_COOKIE_SECURE,
        samesite=settings.JWT_COOKIE_SAMESITE,
        path='/',
    )
    if refresh_token:
        response.set_cookie(
            settings.JWT_REFRESH_COOKIE,
            refresh_token,
            max_age=int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()),
            httponly=True,
            secure=settings.JWT_COOKIE_SECURE,
            samesite=settings.JWT_COOKIE_SAMESITE,
            path='/api/auth/',
        )


def _clear_auth_cookies(response):
    response.delete_cookie(
        settings.JWT_ACCESS_COOKIE,
        path='/',
        samesite=settings.JWT_COOKIE_SAMESITE,
    )
    response.delete_cookie(
        settings.JWT_REFRESH_COOKIE,
        path='/api/auth/',
        samesite=settings.JWT_COOKIE_SAMESITE,
    )


@method_decorator(ensure_csrf_cookie, name='dispatch')
class CsrfCookieView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        get_token(request)
        return Response({'detail': 'CSRF cookie set.'})


@method_decorator(csrf_protect, name='dispatch')
@method_decorator(ensure_csrf_cookie, name='dispatch')
class CookieLoginView(TokenObtainPairView):
    """Validate credentials and set HttpOnly access and refresh cookies."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        response = Response({'detail': 'Login successful.'}, status=status.HTTP_200_OK)
        _set_auth_cookies(
            response,
            serializer.validated_data['access'],
            serializer.validated_data['refresh'],
        )
        get_token(request)
        return response


@method_decorator(csrf_protect, name='dispatch')
class CookieTokenRefreshView(TokenRefreshView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(settings.JWT_REFRESH_COOKIE)
        if not refresh_token:
            raise AuthenticationFailed('Refresh cookie was not provided.')

        serializer = self.get_serializer(data={'refresh': refresh_token})
        serializer.is_valid(raise_exception=True)

        response = Response({'detail': 'Token refreshed.'}, status=status.HTTP_200_OK)
        _set_auth_cookies(
            response,
            serializer.validated_data['access'],
            serializer.validated_data.get('refresh'),
        )
        return response


@method_decorator(csrf_protect, name='dispatch')
class CookieLogoutView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.JWT_REFRESH_COOKIE)
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                pass

        response = Response(status=status.HTTP_204_NO_CONTENT)
        _clear_auth_cookies(response)
        return response


class CurrentUserView(APIView):
    """Return the authenticated user's profile and UI role."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.is_superuser:
            role = 'admin'
            profile = None
        elif user.is_staff:
            role = 'staff'
            profile = None
        elif hasattr(user, 'guardian_profile'):
            role = 'parent'
            profile = GuardianSerializer(user.guardian_profile).data
        elif hasattr(user, 'student_profile'):
            role = 'student'
            profile = StudentSerializer(user.student_profile).data
        else:
            role = 'user'
            profile = None

        return Response(
            {
                'authenticated': True,
                'role': role,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser,
                },
                'profile': profile,
            }
        )
