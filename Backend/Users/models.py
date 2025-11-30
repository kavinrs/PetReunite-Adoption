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
    state = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="owner")
    profile_photo = models.ImageField(upload_to="profile_photos/%Y/%m/%d/", blank=True, null=True)
    verified = models.BooleanField(default=False)
    pincode=models.CharField(max_length=10,blank=True,null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} Profile"


class FoundPetReport(models.Model):
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name="found_reports")
    pet_type = models.CharField(max_length=100)
    breed = models.CharField(max_length=120, blank=True)
    color = models.CharField(max_length=80, blank=True)
    estimated_age = models.CharField(max_length=60, blank=True)
    found_city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    description = models.TextField()
    photo = models.ImageField(upload_to="found_pets/%Y/%m/%d/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Found pet ({self.pet_type}) reported by {self.reporter.username}"


class LostPetReport(models.Model):
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name="lost_reports")
    pet_name = models.CharField(max_length=150, blank=True)
    pet_type = models.CharField(max_length=100)
    breed = models.CharField(max_length=120, blank=True)
    color = models.CharField(max_length=80, blank=True)
    age = models.CharField(max_length=60, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    description = models.TextField()
    photo = models.ImageField(upload_to="lost_pets/%Y/%m/%d/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Lost pet ({self.pet_type}) reported by {self.reporter.username}"