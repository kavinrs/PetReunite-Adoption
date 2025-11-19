# users/models.py
from django.conf import settings
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ("owner", "Owner"),
        ("finder", "Finder"),
        ("staff", "ShelterStaff"),
        ("admin", "Admin"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    full_name = models.CharField(max_length=200, blank=True)
    phone_number = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="owner")
    profile_photo = models.ImageField(upload_to="profile_photos/%Y/%m/%d/", blank=True, null=True)
    verified = models.BooleanField(default=False)
    pincode=models.CharField(max_length=10,blank=True,null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} Profile"
