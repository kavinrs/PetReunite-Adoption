from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import JSONField
import uuid

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
    pet_name = models.CharField(max_length=150, blank=True)
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
    # Stable public unique ID used for communication and referencing found pets
    pet_unique_id = models.CharField(max_length=32, unique=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        """Ensure every found pet report has a stable, unique public ID."""
        # Save first to get the ID if this is a new record
        super().save(*args, **kwargs)
        
        # Now generate pet_unique_id if it doesn't exist
        if not self.pet_unique_id:
            base = f"FP{self.id:06d}"
            candidate = base
            suffix = 1
            while FoundPetReport.objects.filter(pet_unique_id=candidate).exclude(pk=self.pk).exists():
                candidate = f"{base}-{suffix}"
                suffix += 1

            self.pet_unique_id = candidate
            # Update only the pet_unique_id field to avoid triggering save again
            FoundPetReport.objects.filter(pk=self.pk).update(pet_unique_id=candidate)

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
    # Stable public unique ID used for communication and referencing lost pets
    pet_unique_id = models.CharField(max_length=32, unique=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        """Ensure every lost pet report has a stable, unique public ID."""
        # Save first to get the ID if this is a new record
        super().save(*args, **kwargs)
        
        # Now generate pet_unique_id if it doesn't exist
        if not self.pet_unique_id:
            base = f"LP{self.id:06d}"
            candidate = base
            suffix = 1
            while LostPetReport.objects.filter(pet_unique_id=candidate).exclude(pk=self.pk).exists():
                candidate = f"{base}-{suffix}"
                suffix += 1

            self.pet_unique_id = candidate
            # Update only the pet_unique_id field to avoid triggering save again
            LostPetReport.objects.filter(pk=self.pk).update(pet_unique_id=candidate)

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
    # Stable public unique ID used for communication and referencing adoption pets
    pet_unique_id = models.CharField(max_length=32, unique=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        """Ensure every adoption pet has a stable, unique public ID."""
        # Save first to get the ID if this is a new record
        super().save(*args, **kwargs)
        
        # Now generate pet_unique_id if it doesn't exist
        if not self.pet_unique_id:
            base = f"AP{self.id:06d}"
            candidate = base
            suffix = 1
            while Pet.objects.filter(pet_unique_id=candidate).exclude(pk=self.pk).exists():
                candidate = f"{base}-{suffix}"
                suffix += 1

            self.pet_unique_id = candidate
            # Update only the pet_unique_id field to avoid triggering save again
            Pet.objects.filter(pk=self.pk).update(pet_unique_id=candidate)

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
      - read_only: admin can chat, user cannot (waiting)
      - closed: conversation finished (history is read-only)
    """

    STATUS_CHOICES = [
        ("requested", "Requested"),
        ("pending_user", "Pending User Confirmation"),
        ("active", "Active"),
        ("read_only", "Read Only"),
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
    pet_id = models.IntegerField(null=True, blank=True)  # Legacy field, kept for backward compatibility
    pet_unique_id = models.CharField(
        max_length=32,
        blank=True,
        null=True,
        help_text="Unique public ID like FP000024 or LP000029 to avoid confusion between lost/found pets with same numeric ID",
    )
    pet_name = models.CharField(max_length=150, blank=True)
    pet_kind = models.CharField(
        max_length=50,
        blank=True,
        help_text="Type of context: lost, found, adoption, etc.",
    )
    # Reason for chat provided by user when requesting the conversation
    reason_for_chat = models.TextField(
        blank=True,
        null=True,
        help_text="User's explanation for why they want to chat with admin",
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
    text = models.TextField(blank=True)
    # Reply support (WhatsApp-like)
    reply_to = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="replies",
    )
    # Attachment support
    attachment = models.FileField(
        upload_to="chat_attachments/%Y/%m/%d/",
        null=True,
        blank=True,
        help_text="File attachment (image, video, document, or folder archive)"
    )
    attachment_type = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        choices=[
            ('image', 'Image'),
            ('video', 'Video'),
            ('document', 'Document'),
            ('folder', 'Folder Archive'),
        ],
        help_text="Type of attachment"
    )
    attachment_name = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Original filename"
    )
    attachment_size = models.IntegerField(
        null=True,
        blank=True,
        help_text="File size in bytes"
    )
    # Delete support
    is_deleted = models.BooleanField(default=False)
    deleted_for = models.JSONField(default=list, blank=True)
    is_system = models.BooleanField(
        default=False,
        help_text="True for system-generated messages like status changes.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:  # pragma: no cover - string repr
        return f"ChatMessage[{self.conversation_id}] from {self.sender_id}"


class Notification(models.Model):
    """Notification model for storing user and admin notifications"""
    
    NOTIFICATION_TYPES = [
        ('chat_request', 'Chat Request'),
        ('chat_accepted', 'Chat Accepted'),
        ('chat_rejected', 'Chat Rejected'),
        ('chat_message', 'Chat Message'),
        ('chat_room_created', 'Chat Room Created'),
        ('chat_status_changed', 'Chat Status Changed'),
        ('chatroom_invitation', 'Chatroom Invitation'),
        ('chatroom_request_accepted', 'Chatroom Request Accepted'),
        ('chatroom_request_rejected', 'Chatroom Request Rejected'),
        ('adoption_request', 'Adoption Request'),
        ('adoption_status', 'Adoption Status'),
        ('report_status', 'Report Status'),
    ]
    
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(max_length=32, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    from_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_notifications'
    )
    conversation = models.ForeignKey(
        'Conversation',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications'
    )
    chatroom_access_request = models.ForeignKey(
        'ChatroomAccessRequest',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications'
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.notification_type} for {self.recipient.username}"


class Chatroom(models.Model):
    """Chatroom for multi-user conversations related to a pet case"""
    
    name = models.CharField(max_length=255)
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='chatrooms',
        help_text="Parent conversation this chatroom belongs to"
    )
    pet_id = models.IntegerField(null=True, blank=True)
    pet_unique_id = models.CharField(max_length=32, blank=True, null=True)
    pet_name = models.CharField(max_length=150, blank=True)
    pet_kind = models.CharField(max_length=50, blank=True)
    purpose = models.CharField(
        max_length=100,
        blank=True,
        help_text="Purpose: Lost/Found/Reunite"
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_chatrooms'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"Chatroom: {self.name}"


class ChatroomParticipant(models.Model):
    """Participant in a chatroom with role-based access"""
    
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('requested_user', 'Requested User'),
        ('founded_user', 'Founded User'),
    ]
    
    chatroom = models.ForeignKey(
        Chatroom,
        on_delete=models.CASCADE,
        related_name='participants'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='chatroom_participations'
    )
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['chatroom', 'user']
        ordering = ['joined_at']
    
    def __str__(self):
        return f"{self.user.username} in {self.chatroom.name} as {self.role}"


class ChatroomAccessRequest(models.Model):
    """Access request for users to join a chatroom (requires approval)"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    
    REQUEST_TYPE_CHOICES = [
        ('chatroom_join_request', 'Chatroom Join Request'),
        ('chatroom_creation_request', 'Chatroom Creation Request'),
    ]
    
    chatroom = models.ForeignKey(
        Chatroom,
        on_delete=models.CASCADE,
        related_name='access_requests',
        null=True,
        blank=True,
        help_text="Chatroom (null if chatroom not yet created)"
    )
    pet = models.ForeignKey(
        'LostPetReport',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='chatroom_access_requests',
        help_text="Pet related to this chatroom (can be Lost or Found)"
    )
    pet_unique_id = models.CharField(
        max_length=32,
        blank=True,
        null=True,
        help_text="Unique ID of the pet (FP/LP prefix)"
    )
    pet_kind = models.CharField(
        max_length=50,
        blank=True,
        help_text="lost or found"
    )
    requested_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='chatroom_requests'
    )
    added_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='chatroom_invitations'
    )
    role = models.CharField(
        max_length=50,
        default='requested_user',
        help_text="Role the user will have if accepted"
    )
    request_type = models.CharField(
        max_length=100,
        choices=REQUEST_TYPE_CHOICES,
        default='chatroom_join_request',
        help_text="Type of request: join existing or create new chatroom"
    )
    conversation = models.ForeignKey(
        'Conversation',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='chatroom_access_requests',
        help_text="Related conversation for chatroom creation"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        if self.chatroom:
            return f"Access request for {self.requested_user.username} to {self.chatroom.name} ({self.status})"
        return f"Chatroom creation request for {self.requested_user.username} ({self.status})"


class ChatroomMessage(models.Model):
    """Message in a chatroom"""
    
    chatroom = models.ForeignKey(
        Chatroom,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField(blank=True)
    reply_to = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='replies'
    )
    # Attachment support
    attachment = models.FileField(
        upload_to="chatroom_attachments/%Y/%m/%d/",
        null=True,
        blank=True,
        help_text="File attachment (image, video, document, or folder archive)"
    )
    attachment_type = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        choices=[
            ('image', 'Image'),
            ('video', 'Video'),
            ('document', 'Document'),
            ('folder', 'Folder Archive'),
        ],
        help_text="Type of attachment"
    )
    attachment_name = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Original filename"
    )
    attachment_size = models.IntegerField(
        null=True,
        blank=True,
        help_text="File size in bytes"
    )
    is_deleted = models.BooleanField(default=False)
    deleted_for = models.JSONField(default=list, blank=True)
    is_system = models.BooleanField(
        default=False,
        help_text="True for system messages like 'User joined'"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"ChatroomMessage in {self.chatroom.name} from {self.sender.username}"
