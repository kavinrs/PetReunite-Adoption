from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import AuditLog, ChatRoom, ChatRoomMember, Message


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "is_staff"]


class ChatRoomSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = ChatRoom
        fields = ["id", "title", "created_by", "is_active", "metadata", "created_at", "updated_at"]


class ChatRoomMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ChatRoomMember
        fields = ["id", "room", "user", "added_by", "role", "joined_at"]
        read_only_fields = ["id", "room", "user", "added_by", "joined_at"]


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "room",
            "sender",
            "content",
            "content_type",
            "attachments",
            "is_deleted",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "room", "sender", "created_at", "updated_at", "is_deleted"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.is_deleted:
            data["content"] = "[deleted]"
            data["attachments"] = None
        return data


class AuditLogSerializer(serializers.ModelSerializer):
    actor = UserSerializer(read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "actor",
            "action",
            "target_type",
            "target_id",
            "detail",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]