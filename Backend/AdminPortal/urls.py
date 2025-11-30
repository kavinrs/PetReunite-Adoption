from django.urls import path

from .views import verify_admin_email, admin_register

urlpatterns = [
    path("verify-email/", verify_admin_email, name="admin-verify-email"),
    path("register/", admin_register, name="admin-register"),
]
