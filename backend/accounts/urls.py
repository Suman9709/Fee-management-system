from django.urls import path

from .views import (
    CookieLoginView,
    CookieLogoutView,
    CookieTokenRefreshView,
    CurrentUserView,
    CsrfCookieView,
)


urlpatterns = [
    path('csrf/', CsrfCookieView.as_view(), name='csrf-cookie'),
    path('login/', CookieLoginView.as_view(), name='cookie-login'),
    path('refresh/', CookieTokenRefreshView.as_view(), name='cookie-token-refresh'),
    path('logout/', CookieLogoutView.as_view(), name='cookie-logout'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
]

