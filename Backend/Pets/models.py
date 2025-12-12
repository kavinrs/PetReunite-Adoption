from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import JSONField

User = get_user_model()


STATUS_CHOICES = [
    ("pending", "Pending review"),
    ("approved", "Approved"),
    ("rejected", "Rejected"),
    ("investigating", "Under investigation"),
    ("matched", "Matched with potential owner"),
    ("resolved", "Resolved"),
    ("closed", "Closed"),
]


class FoundPetReport(models.Model):
    reporter = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="petsapp_found_reports"
    )
    pet_type = models.CharField(max_length=100)
    breed = models.CharField(max_length=120, blank=True)
    gender=models.CharField(max_length=10, blank=True)
    color = models.CharField(max_length=80, blank=True)
    weight = models.CharField(max_length=50, blank=True)
    estimated_age = models.CharField(max_length=60, blank=True)
    found_city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10, blank=True)
    location_url = models.URLField(max_length=500, blank=True)
    found_time = models.DateTimeField(null=True, blank=True)
    description = models.TextField()
    photo = models.ImageField(
        upload_to="found_pets/%Y/%m/%d/",
        blank=True,
        null=True,
    )
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default="pending")
    admin_notes = models.TextField(blank=True)
    has_user_update = models.BooleanField(default=False)
    previous_snapshot = JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[Pets] Found {self.pet_type} by {self.reporter.username}"


class LostPetReport(models.Model):
    reporter = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="petsapp_lost_reports"
    )
    pet_name = models.CharField(max_length=150, blank=True)
    pet_type = models.CharField(max_length=100)
    breed = models.CharField(max_length=120, blank=True)
    gender=models.CharField(max_length=10,blank=True)
    color = models.CharField(max_length=80, blank=True)
    weight = models.CharField(max_length=50, blank=True)
    vaccinated = models.CharField(max_length=20, blank=True)
    age = models.CharField(max_length=60, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10, blank=True)
    location_url = models.URLField(max_length=500, blank=True)
    lost_time = models.DateTimeField(null=True, blank=True)
    description = models.TextField()
    photo = models.ImageField(
        upload_to="lost_pets/%Y/%m/%d/",
        blank=True,
        null=True,
    )
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default="pending")
    admin_notes = models.TextField(blank=True)
    has_user_update = models.BooleanField(default=False)
    previous_snapshot = JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[Pets] Lost {self.pet_type} by {self.reporter.username}"


class Pet(models.Model):
    """Pet model for adoption listings"""

    name = models.CharField(max_length=150)
    species = models.CharField(max_length=50)  # Dog, Cat, Bird, etc.
    breed = models.CharField(max_length=120, blank=True)
    gender=models.CharField(max_length=10,blank=True)
    description = models.TextField()
    age = models.CharField(max_length=60, blank=True)
    color = models.CharField(max_length=80, blank=True)
    location_city = models.CharField(max_length=100)
    location_state = models.CharField(max_length=100)
    photos = models.URLField(max_length=500, blank=True, null=True)
    posted_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="posted_pets"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} - {self.species} ({self.breed})"


class AdoptionRequest(models.Model):
    """Adoption request model"""

    HOME_OWNERSHIP_CHOICES = [
        ("own", "Own"),
        ("rent", "Rent"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    pet = models.ForeignKey(
        Pet, on_delete=models.CASCADE, related_name="adoption_requests"
    )
    requester = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="adoption_requests"
    )
    phone = models.CharField(max_length=20)
    address = models.TextField()
    household_info = models.TextField(blank=True)
    experience_with_pets = models.TextField()
    reason_for_adopting = models.TextField()
    has_other_pets = models.BooleanField(default=False)
    other_pets_details = models.TextField(blank=True)
    home_ownership = models.CharField(max_length=10, choices=HOME_OWNERSHIP_CHOICES)
    preferred_meeting = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ["pet", "requester"]  # One request per user per pet

    def __str__(self):
        return f"Adoption Request for {self.pet.name} by {self.requester.username}"


class Message(models.Model):
    """Chat message model for adoption requests"""

    adoption_request = models.ForeignKey(
        AdoptionRequest, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Message from {self.sender.username} in {self.adoption_request}"


class Conversation(models.Model):
    """Generic user-admin chat conversation.

    Supports multiple conversations per user; each conversation may be claimed
    by a specific admin user. Status values:
      - requested: user requested chat, no admin has accepted yet
      - pending_user: admin accepted, waiting for user confirmation
      - active: both parties can chat
      - closed: conversation finished (history is read-only)
    """

    STATUS_CHOICES = [
        ("requested", "Requested"),
        ("pending_user", "Pending User Confirmation"),
        ("active", "Active"),
        ("closed", "Closed"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="chat_conversations",
    )
    admin = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="admin_chat_conversations",
        null=True,
        blank=True,
    )
    # Optional pet context so admin can see which pet/report this chat is about.
    # For example, a lost report, found report, or adoption pet.
    pet_id = models.IntegerField(null=True, blank=True)
    pet_name = models.CharField(max_length=150, blank=True)
    pet_kind = models.CharField(
        max_length=50,
        blank=True,
        help_text="Type of context: lost, found, adoption, etc.",
    )
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default="requested")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self) -> str:  # pragma: no cover - string repr
        label = self.user.username if self.user_id else "?"
        return f"Conversation with {label} ({self.status})"


class ChatMessage(models.Model):
    """Message in a generic user-admin conversation."""

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    is_system = models.BooleanField(
        default=False,
        help_text="True for system-generated messages like status changes.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:  # pragma: no cover - string repr
        return f"ChatMessage[{self.conversation_id}] from {self.sender_id}"
