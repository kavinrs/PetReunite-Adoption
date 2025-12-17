# users/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile, VolunteerRequest
User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    # Add UserProfile fields here
    full_name = serializers.CharField(required=True, write_only=True)
    phone_number = serializers.CharField(required=True, write_only=True)
    address = serializers.CharField(required=True, write_only=True)
    pincode = serializers.CharField(required=True, write_only=True)
    state = serializers.CharField(required=True, write_only=True)
    city = serializers.CharField(required=True, write_only=True)
    landmark = serializers.CharField(required=False, allow_blank=True, write_only=True)
    location_url = serializers.CharField(required=False, allow_blank=True, write_only=True)


    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "password",
            "full_name",
            "phone_number",
            "state",
            "city",
            "landmark",
            "address",
            "pincode",
            "location_url",
        )

    def create(self, validated_data):
        # Extract profile fields
        full_name = validated_data.pop("full_name")
        phone_number = validated_data.pop("phone_number")
        address = validated_data.pop("address")
        state = validated_data.pop("state")
        city = validated_data.pop("city")
        pincode = validated_data.pop("pincode")
        landmark = validated_data.pop("landmark", "")
        location_url = validated_data.pop("location_url", "")

        # Create main Django User
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()

        # Create UserProfile with all data
        UserProfile.objects.create(
            user=user,
            full_name=full_name,
            phone_number=phone_number,
            address=address,
            state=state,
            city=city,
            pincode=pincode,
            landmark=landmark,
            location_url=location_url,
        )

        return user



class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "is_staff", "is_superuser", "date_joined")

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = (
            "id",
            "user",
            "user_unique_id",
            "full_name",
            "phone_number",
            "address",
            "state",
            "city",
            "pincode",
            "landmark",
            "location_url",
            "role",
            "verified",
            "profile_photo",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("role", "verified", "user_unique_id")


class VolunteerRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VolunteerRequest
        fields = (
            "id",
            "full_name",
            "date_of_birth",
            "phone_number",
            "email",
            "city",
            "state",
            "pincode",
            "availability",
            "skills",
            "experience_level",
            "id_proof_type",
            "id_proof_document",
            "motivation",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def create(self, validated_data):
        user = self.context["request"].user
        return VolunteerRequest.objects.create(user=user, **validated_data)


class VolunteerRequestListSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    profile_photo = serializers.ImageField(source="user.profile.profile_photo", read_only=True)

    class Meta:
        model = VolunteerRequest
        fields = (
            "id",
            "user",
            "profile_photo",
            "full_name",
            "phone_number",
            "email",
            "city",
            "state",
            "pincode",
            "skills",
            "experience_level",
            "status",
            "created_at",
        )


class AdminVolunteerRequestSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    profile_photo = serializers.ImageField(source="user.profile.profile_photo", read_only=True)

    class Meta:
        model = VolunteerRequest
        fields = (
            "id",
            "user",
            "profile_photo",
            "full_name",
            "date_of_birth",
            "phone_number",
            "email",
            "city",
            "state",
            "pincode",
            "availability",
            "skills",
            "experience_level",
            "id_proof_type",
            "id_proof_document",
            "motivation",
            "status",
            "admin_notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "user", "created_at", "updated_at")


# class FoundPetReportSerializer(serializers.ModelSerializer):
#     reporter = UserSerializer(read_only=True)

#     class Meta:
#         model = FoundPetReport
#         fields = (
#             "id",
#             "reporter",
#             "pet_type",
#             "breed",
#             "color",
#             "estimated_age",
#             "found_city",
#             "state",
#             "description",
#             "photo",
#             "created_at",
#             "updated_at",
#         )
#         read_only_fields = ("id", "reporter", "created_at", "updated_at")


# class LostPetReportSerializer(serializers.ModelSerializer):
#     reporter = UserSerializer(read_only=True)

#     class Meta:
#         model = LostPetReport
#         fields = (
#             "id",
#             "reporter",
#             "pet_name",
#             "pet_type",
#             "breed",
#             "color",
#             "age",
#             "city",
#             "state",
#             "description",
#             "photo",
#             "created_at",
#             "updated_at",
#         )
#         read_only_fields = ("id", "reporter", "created_at", "updated_at")
