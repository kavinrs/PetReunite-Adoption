import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


User = settings.AUTH_USER_MODEL


class ChatRoom(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    created_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="created_rooms"
    )
    is_active = models.BooleanField(default=True)
    metadata = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({self.id})"


class ChatRoomMember(models.Model):
    ROLE_PARTICIPANT = "participant"
    ROLE_ADMIN = "admin"

    ROLE_CHOICES = [
        (ROLE_PARTICIPANT, "Participant"),
        (ROLE_ADMIN, "Admin"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="chat_memberships")
    added_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="added_chat_memberships",
    )
    role = models.CharField(max_length=32, choices=ROLE_CHOICES, default=ROLE_PARTICIPANT)
    joined_at = models.DateTimeField(default=timezone.now, editable=False)

    class Meta:
        unique_together = ("room", "user")
        ordering = ["joined_at"]

    def __str__(self) -> str:
        return f"{self.user} in {self.room} ({self.role})"


class Message(models.Model):
    CONTENT_TEXT = "text"
    CONTENT_IMAGE = "image"
    CONTENT_FILE = "file"
    CONTENT_SYSTEM = "system"

    CONTENT_TYPE_CHOICES = [
        (CONTENT_TEXT, "Text"),
        (CONTENT_IMAGE, "Image"),
        (CONTENT_FILE, "File"),
        (CONTENT_SYSTEM, "System"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="messages"
    )
    content = models.TextField(null=True, blank=True)
    content_type = models.CharField(
        max_length=16, choices=CONTENT_TYPE_CHOICES, default=CONTENT_TEXT
    )
    attachments = models.JSONField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        base = self.content or "(no content)"
        return f"Message {self.id} in {self.room_id}: {base[:30]}"


class AuditLog(models.Model):
    ACTION_ROOM_CREATED = "room_created"
    ACTION_MEMBER_ADDED = "member_added"
    ACTION_MEMBER_REMOVED = "member_removed"
    ACTION_MESSAGE_DELETED = "message_deleted"
    ACTION_ROOM_DELETED = "room_deleted"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="audit_logs"
    )
    action = models.CharField(max_length=64)
    target_type = models.CharField(max_length=64)
    target_id = models.UUIDField(null=True, blank=True)
    detail = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now, editable=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.action} by {self.actor} on {self.target_type} {self.target_id}"