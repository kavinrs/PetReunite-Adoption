from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class FoundPetReport(models.Model):
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name="petsapp_found_reports")
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
        return f"[Pets] Found {self.pet_type} by {self.reporter.username}"


class LostPetReport(models.Model):
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name="petsapp_lost_reports")
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
        return f"[Pets] Lost {self.pet_type} by {self.reporter.username}"
