from django.contrib import admin

from .models import AdminInvite, AdminProfile


@admin.register(AdminInvite)
class AdminInviteAdmin(admin.ModelAdmin):
    list_display = ("email", "superuser_name", "admin_code", "created_at", "updated_at")
    search_fields = ("email", "superuser_name")


@admin.register(AdminProfile)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "admin_code", "created_at", "updated_at")
    search_fields = ("user__username", "user__email")
