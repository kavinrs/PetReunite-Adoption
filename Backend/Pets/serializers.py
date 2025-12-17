from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import (
    AdoptionRequest,
    ChatMessage,
    Conversation,
    FoundPetReport,
    LostPetReport,
    Message,
    Pet,
)

User = get_user_model()


class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email")


class FoundPetReportSerializer(serializers.ModelSerializer):
    reporter = UserSummarySerializer(read_only=True)
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = FoundPetReport
        fields = (
            "id",
            "pet_unique_id",
            "reporter",
            "pet_type",
            "breed",
            "gender",
            "color",
            "weight",
            "estimated_age",
            "found_city",
            "state",
            "pincode",
            "location_url",
            "found_time",
            "description",
            "photo",
            "photo_url",
            "status",
            "admin_notes",
            "has_user_update",
            "previous_snapshot",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "pet_unique_id",
            "reporter",
            "status",
            "admin_notes",
            "has_user_update",
            "previous_snapshot",
            "created_at",
            "updated_at",
        )

    def get_photo_url(self, obj):
        try:
            if obj.photo and hasattr(obj.photo, "url"):
                return obj.photo.url
        except Exception:
            pass
        # Fallback if stored as plain string
        return str(obj.photo) if obj.photo else None


class LostPetReportSerializer(serializers.ModelSerializer):
    reporter = UserSummarySerializer(read_only=True)
    photo_url = serializers.SerializerMethodField()
    public_id = serializers.SerializerMethodField()

    class Meta:
        model = LostPetReport
        fields = (
            "id",
            "public_id",
            "reporter",
            "pet_name",
            "pet_type",
            "breed",
            "gender",
            "color",
            "weight",
            "vaccinated",
            "age",
            "city",
            "state",
            "pincode",
            "location_url",
            "lost_time",
            "description",
            "photo",
            "photo_url",
            "status",
            "admin_notes",
            "has_user_update",
            "previous_snapshot",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "reporter",
            "status",
            "admin_notes",
            "has_user_update",
            "previous_snapshot",
            "created_at",
            "updated_at",
        )

    def get_photo_url(self, obj):
        try:
            if obj.photo and hasattr(obj.photo, "url"):
                return obj.photo.url
        except Exception:
            pass
        return str(obj.photo) if obj.photo else None

    def get_public_id(self, obj):
        # Prefix with L to distinguish from found/adoption IDs in the UI
        return f"L{obj.id}"

    def update(self, instance, validated_data):
        """On user edits of already-reviewed reports, capture a snapshot.

        This complements the view-level perform_update and guarantees that
        previous_snapshot/has_user_update are populated even if the view hook
        is bypassed for some reason.
        """
        if instance.status != "pending" and not instance.previous_snapshot:
            instance.previous_snapshot = {
                "pet_name": instance.pet_name,
                "pet_type": instance.pet_type,
                "breed": instance.breed,
                "color": instance.color,
                "weight": instance.weight,
                "vaccinated": instance.vaccinated,
                "age": instance.age,
                "city": instance.city,
                "state": instance.state,
                "pincode": instance.pincode,
                "location_url": instance.location_url,
                "description": instance.description,
            }
        if instance.status != "pending":
            instance.has_user_update = True

        return super().update(instance, validated_data)


class AdminFoundPetReportSerializer(FoundPetReportSerializer):
    class Meta(FoundPetReportSerializer.Meta):
        read_only_fields = ("id", "reporter", "created_at", "updated_at")


class AdminLostPetReportSerializer(LostPetReportSerializer):
    class Meta(LostPetReportSerializer.Meta):
        read_only_fields = ("id", "reporter", "created_at", "updated_at")


class PetSerializer(serializers.ModelSerializer):
    posted_by = UserSummarySerializer(read_only=True)

    class Meta:
        model = Pet
        fields = (
            "id",
            "pet_unique_id",
            "name",
            "species",
            "breed",
            "gender",
            "description",
            "age",
            "color",
            "location_city",
            "location_state",
            "photos",
            "posted_by",
            "created_at",
            "is_active",
        )
        read_only_fields = ("id", "pet_unique_id", "posted_by", "created_at")


class AdoptionRequestSerializer(serializers.ModelSerializer):
    requester = UserSummarySerializer(read_only=True)
    pet = PetSerializer(read_only=True)

    class Meta:
        model = AdoptionRequest
        fields = (
            "id",
            "pet",
            "requester",
            "phone",
            "address",
            "household_info",
            "experience_with_pets",
            "reason_for_adopting",
            "has_other_pets",
            "other_pets_details",
            "home_ownership",
            "preferred_meeting",
            "status",
            "admin_notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "pet",
            "requester",
            "status",
            "admin_notes",
            "created_at",
            "updated_at",
        )

    def validate(self, data):
        if data.get("has_other_pets") and not data.get("other_pets_details"):
            raise serializers.ValidationError(
                {"other_pets_details": "Please provide details about your other pets."}
            )
        return data


class AdoptionRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdoptionRequest
        fields = (
            "phone",
            "address",
            "household_info",
            "experience_with_pets",
            "reason_for_adopting",
            "has_other_pets",
            "other_pets_details",
            "home_ownership",
            "preferred_meeting",
        )

    def validate(self, data):
        if data.get("has_other_pets") and not data.get("other_pets_details"):
            raise serializers.ValidationError(
                {"other_pets_details": "Please provide details about your other pets."}
            )
        return data


class AdoptionRequestListSerializer(serializers.ModelSerializer):
    """Serializer for admin view of adoption requests"""

    requester = UserSummarySerializer(read_only=True)
    pet_name = serializers.CharField(source="pet.name", read_only=True)
    pet_species = serializers.CharField(source="pet.species", read_only=True)

    class Meta:
        model = AdoptionRequest
        fields = (
            "id",
            "pet_name",
            "pet_species",
            "requester",
            "phone",
            "status",
            "created_at",
            "updated_at",
        )


class AdminAdoptionRequestSerializer(serializers.ModelSerializer):
    """Serializer for admin updates to adoption requests"""

    class Meta:
        model = AdoptionRequest
        fields = ("status", "admin_notes")


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSummarySerializer(read_only=True)
    sender_name = serializers.CharField(source="sender.username", read_only=True)
    is_admin = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = (
            "id",
            "adoption_request",
            "sender",
            "sender_name",
            "is_admin",
            "text",
            "created_at",
            "read",
        )
        read_only_fields = ("id", "adoption_request", "sender", "created_at")

    def get_is_admin(self, obj):
        return obj.sender.is_staff or obj.sender.is_superuser


class MessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ("text",)

    def validate_text(self, value):
        if not value.strip():
            raise serializers.ValidationError("Message cannot be empty.")
        return value.strip()


class ConversationSerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)
    admin = UserSummarySerializer(read_only=True)

    class Meta:
        model = Conversation
        fields = (
            "id",
            "user",
            "admin",
            "pet_id",
            "pet_unique_id",
            "pet_name",
            "pet_kind",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "user",
            "admin",
            "pet_id",
            "pet_unique_id",
            "pet_name",
            "pet_kind",
            "created_at",
            "updated_at",
        )


class ConversationCreateSerializer(serializers.ModelSerializer):
    # Optional initial message that will be stored as the first chat message
    # in the conversation. This allows users to explain why they are requesting
    # a chat (e.g. claiming a found pet) without immediately starting an
    # interactive chat session.
    initial_message = serializers.CharField(
        write_only=True, required=False, allow_blank=True
    )

    class Meta:
        model = Conversation
        # Optional pet context can be passed from the frontend when the
        # conversation is created so admins see which pet/report it refers to.
        # initial_message is write-only and is not stored on the Conversation
        # model itself; instead, it becomes the first ChatMessage.
        # pet_unique_id is preferred over pet_id to avoid confusion when lost/found
        # pets have the same numeric ID.
        fields = ("pet_id", "pet_unique_id", "pet_name", "pet_kind", "initial_message")

    def create(self, validated_data):
        request = self.context["request"]
        user = request.user

        # Pull out the optional initial message text.
        initial_message = validated_data.pop("initial_message", "").strip()

        # If pet_unique_id is provided, prefer it over pet_id to avoid confusion.
        # If only pet_id is provided (legacy), keep it for backward compatibility.
        # Create a fresh conversation in requested state, attaching any
        # provided pet context so admins can see what this is about.
        convo = Conversation.objects.create(user=user, **validated_data)

        # If the user provided an initial message, save it as the first
        # ChatMessage in this conversation. The conversation remains in the
        # "requested" state; admins must still accept before chat is active.
        if initial_message:
            ChatMessage.objects.create(
                conversation=convo,
                sender=user,
                text=initial_message,
                is_system=False,
            )

        return convo


class ChatMessageSerializer(serializers.ModelSerializer):
    sender = UserSummarySerializer(read_only=True)
    sender_role = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = (
            "id",
            "conversation",
            "sender",
            "sender_role",
            "text",
            "is_system",
            "created_at",
        )
        read_only_fields = (
            "id",
            "conversation",
            "sender",
            "sender_role",
            "is_system",
            "created_at",
        )

    def get_sender_role(self, obj):
        # Identify whether this message was sent by the user or the admin for UI alignment.
        try:
            convo_user_id = obj.conversation.user_id
        except Exception:  # pragma: no cover - defensive
            convo_user_id = None
        if convo_user_id is not None and obj.sender_id == convo_user_id:
            return "user"
        return "admin"


class ChatMessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ("text",)

    def validate_text(self, value):
        if not value.strip():
            raise serializers.ValidationError("Message cannot be empty.")
        return value.strip()
