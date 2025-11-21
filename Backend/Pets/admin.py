from django.contrib import admin

from .models import FoundPetReport, LostPetReport


@admin.register(FoundPetReport)
class PetsFoundPetAdmin(admin.ModelAdmin):
    list_display = ("id", "pet_type", "found_city", "state", "reporter", "created_at")
    search_fields = ("pet_type", "breed", "color", "found_city", "state", "description", "reporter__username")
    list_filter = ("state", "found_city", "pet_type")


@admin.register(LostPetReport)
class PetsLostPetAdmin(admin.ModelAdmin):
    list_display = ("id", "pet_type", "city", "state", "reporter", "created_at")
    search_fields = ("pet_name", "pet_type", "breed", "color", "city", "state", "description", "reporter__username")
    list_filter = ("state", "city", "pet_type")
