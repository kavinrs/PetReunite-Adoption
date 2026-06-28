               
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView,
    MeView,
    AdminLoginView,
    EmailLoginView,
    VolunteerRequestView,
    AdminVolunteerListView,
    AdminVolunteerDetailView,
    NearbyUsersView,
)

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("users/me/", MeView.as_view(), name="users-me"),
    path("users/nearby/", NearbyUsersView.as_view(), name="nearby-users"),
    path("admin/login/", AdminLoginView.as_view(), name="admin-login"),
    path("auth/login/", EmailLoginView.as_view(), name="auth-login"),
                
    path("volunteers/", VolunteerRequestView.as_view(), name="volunteers"),
    path("admin/volunteers/", AdminVolunteerListView.as_view(), name="admin-volunteers"),
    path("admin/volunteers/<int:pk>/", AdminVolunteerDetailView.as_view(), name="admin-volunteer-detail"),
]
