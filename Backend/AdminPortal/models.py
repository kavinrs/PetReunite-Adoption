from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class AdminInvite(models.Model):
    email = models.EmailField(unique=True)
    superuser_name = models.CharField(max_length=150, blank=True)
    admin_code = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    def __str__(self) -> str:  # pragma: no cover - simple representation
        return f"Invite for {self.email}"


class AdminProfile(models.Model):
    """Stores admin-specific details such as the registration code.

    This is kept separate from the general UserProfile model in the Users app
    so that admin concerns live in the AdminPortal app.
    """

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="admin_profile")
    admin_code = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:  
        return f"AdminProfile for {self.user.username}"
