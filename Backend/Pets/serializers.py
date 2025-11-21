from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import FoundPetReport, LostPetReport

User = get_user_model()


class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email")


class FoundPetReportSerializer(serializers.ModelSerializer):
    reporter = UserSummarySerializer(read_only=True)

    class Meta:
        model = FoundPetReport
        fields = (
            "id",
            "reporter",
            "pet_type",
            "breed",
            "color",
            "estimated_age",
            "found_city",
            "state",
            "description",
            "photo",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "reporter", "created_at", "updated_at")


class LostPetReportSerializer(serializers.ModelSerializer):
    reporter = UserSummarySerializer(read_only=True)

    class Meta:
        model = LostPetReport
        fields = (
            "id",
            "reporter",
            "pet_name",
            "pet_type",
            "breed",
            "color",
            "age",
            "city",
            "state",
            "description",
            "photo",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "reporter", "created_at", "updated_at")

