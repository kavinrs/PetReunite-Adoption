# users/admin.py
from django.contrib import admin
from .models import UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "full_name", "role", "verified", "created_at")
    list_filter = ("role", "verified")
    search_fields = ("user__username", "full_name", "phone_number", "user__email")
