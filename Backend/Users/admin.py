# users/admin.py
from django.contrib import admin
from .models import UserProfile, FoundPetReport, LostPetReport


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "full_name", "role", "verified", "created_at")
    list_filter = ("role", "verified")
    search_fields = ("user__username", "full_name", "phone_number", "user__email")


@admin.register(FoundPetReport)
class FoundPetReportAdmin(admin.ModelAdmin):
    list_display = ("id", "pet_type", "found_city", "state", "reporter", "created_at")
    list_filter = ("state", "found_city", "pet_type")
    search_fields = ("pet_type", "breed", "color", "found_city", "state", "description", "reporter__username")


@admin.register(LostPetReport)
class LostPetReportAdmin(admin.ModelAdmin):
    list_display = ("id", "pet_type", "city", "state", "reporter", "created_at")
    list_filter = ("state", "city", "pet_type")
    search_fields = ("pet_name", "pet_type", "breed", "color", "city", "state", "description", "reporter__username")
