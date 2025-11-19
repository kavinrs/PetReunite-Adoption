# users/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    # Add UserProfile fields here
    full_name = serializers.CharField(required=True, write_only=True)
    phone_number = serializers.CharField(required=True, write_only=True)
    address = serializers.CharField(required=True, write_only=True)
    pincode = serializers.CharField(required=True, write_only=True)


    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "password",
            "full_name",
            "phone_number",
            "address",
            "pincode",
        )

    def create(self, validated_data):
        # Extract profile fields
        full_name = validated_data.pop("full_name")
        phone_number = validated_data.pop("phone_number")
        address = validated_data.pop("address")
        pincode = validated_data.pop("pincode")

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
            pincode=pincode,
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
            "full_name",
            "phone_number",
            "address",
            "role",
            "verified",
            "profile_photo",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("role", "verified")
