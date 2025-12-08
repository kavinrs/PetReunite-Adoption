from django.contrib import admin
from django.utils.html import format_html

from .models import AdoptionRequest, FoundPetReport, LostPetReport, Message, Pet


@admin.register(FoundPetReport)
class PetsFoundPetAdmin(admin.ModelAdmin):
    list_display = ("id", "pet_type", "found_city", "state", "reporter", "created_at")
    search_fields = (
        "pet_type",
        "breed",
        "color",
        "found_city",
        "state",
        "description",
        "reporter__username",
    )
    list_filter = ("state", "found_city", "pet_type")


@admin.register(LostPetReport)
class PetsLostPetAdmin(admin.ModelAdmin):
    list_display = ("id", "pet_type", "city", "state", "reporter", "created_at")
    search_fields = (
        "pet_name",
        "pet_type",
        "breed",
        "color",
        "city",
        "state",
        "description",
        "reporter__username",
    )
    list_filter = ("state", "city", "pet_type")


@admin.register(Pet)
class PetAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "species",
        "breed",
        "location_city",
        "location_state",
        "posted_by",
        "is_active",
        "created_at",
    )
    list_filter = (
        "species",
        "location_state",
        "location_city",
        "is_active",
        "created_at",
    )
    search_fields = (
        "name",
        "species",
        "breed",
        "location_city",
        "description",
        "posted_by__username",
    )
    readonly_fields = ("created_at",)
    list_editable = ("is_active",)


@admin.register(AdoptionRequest)
class AdoptionRequestAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "pet_name",
        "requester_name",
        "phone",
        "status_badge",
        "created_at",
    )
    list_filter = ("status", "created_at", "pet__species", "home_ownership")
    search_fields = (
        "pet__name",
        "requester__username",
        "requester__email",
        "phone",
        "address",
    )
    readonly_fields = ("created_at", "updated_at")
    actions = ["mark_approved", "mark_rejected"]

    fieldsets = (
        (
            "Request Information",
            {"fields": ("pet", "requester", "status", "created_at", "updated_at")},
        ),
        ("Contact Details", {"fields": ("phone", "address", "household_info")}),
        (
            "Pet Experience",
            {
                "fields": (
                    "experience_with_pets",
                    "has_other_pets",
                    "other_pets_details",
                    "home_ownership",
                )
            },
        ),
        (
            "Application Details",
            {"fields": ("reason_for_adopting", "preferred_meeting")},
        ),
        ("Admin Notes", {"fields": ("admin_notes",), "classes": ("collapse",)}),
    )

    def pet_name(self, obj):
        return obj.pet.name

    pet_name.short_description = "Pet"

    def requester_name(self, obj):
        return f"{obj.requester.username} ({obj.requester.email})"

    requester_name.short_description = "Requester"

    def status_badge(self, obj):
        colors = {
            "pending": "#fbbf24",  # yellow
            "approved": "#10b981",  # green
            "rejected": "#ef4444",  # red
        }
        color = colors.get(obj.status, "#6b7280")
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">{}</span>',
            color,
            obj.get_status_display(),
        )

    status_badge.short_description = "Status"

    def mark_approved(self, request, queryset):
        count = queryset.update(status="approved")
        self.message_user(request, f"{count} requests marked as approved.")

    mark_approved.short_description = "Mark selected requests as approved"

    def mark_rejected(self, request, queryset):
        count = queryset.update(status="rejected")
        self.message_user(request, f"{count} requests marked as rejected.")

    mark_rejected.short_description = "Mark selected requests as rejected"


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "adoption_request_short",
        "sender",
        "text_preview",
        "created_at",
        "read",
    )
    list_filter = ("read", "created_at", "sender__is_staff")
    search_fields = ("text", "sender__username", "adoption_request__pet__name")
    readonly_fields = ("created_at",)

    def adoption_request_short(self, obj):
        return f"#{obj.adoption_request.id} - {obj.adoption_request.pet.name}"

    adoption_request_short.short_description = "Adoption Request"

    def text_preview(self, obj):
        return obj.text[:50] + "..." if len(obj.text) > 50 else obj.text

    text_preview.short_description = "Message Preview"
