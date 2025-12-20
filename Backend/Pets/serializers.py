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
    Notification,
    Chatroom,
    ChatroomParticipant,
    ChatroomAccessRequest,
    ChatroomMessage,
)

User = get_user_model()


class UserSummarySerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    user_unique_id = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ("id", "username", "email", "full_name", "is_staff", "user_unique_id")
    
    def get_full_name(self, obj):
        """Get full name from user profile if it exists"""
        if hasattr(obj, 'profile') and obj.profile:
            return obj.profile.full_name or obj.username
        return obj.username
    
    def get_user_unique_id(self, obj):
        """Get stable user_unique_id from profile"""
        if hasattr(obj, 'profile') and obj.profile:
            return obj.profile.user_unique_id
        return None


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
            "reason_for_chat",
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
        # reason_for_chat is now stored directly on the Conversation model
        fields = ("pet_id", "pet_unique_id", "pet_name", "pet_kind", "reason_for_chat", "initial_message")

    def create(self, validated_data):
        request = self.context["request"]
        user = request.user

        # Pull out the optional initial message text.
        initial_message = validated_data.pop("initial_message", "").strip()

        # If pet_unique_id is provided, prefer it over pet_id to avoid confusion.
        # If only pet_id is provided (legacy), keep it for backward compatibility.
        # Create a fresh conversation in requested state, attaching any
        # provided pet context so admins can see what this is about.
        # reason_for_chat is now stored directly on the Conversation model
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
    reply_to = serializers.SerializerMethodField()
    is_deleted_for_me = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = (
            "id",
            "conversation",
            "sender",
            "sender_role",
            "text",
            "reply_to",
            "attachment",
            "attachment_type",
            "attachment_name",
            "attachment_size",
            "attachment_url",
            "is_deleted",
            "is_deleted_for_me",
            "is_system",
            "created_at",
        )
        read_only_fields = (
            "id",
            "conversation",
            "sender",
            "sender_role",
            "reply_to",
            "attachment_url",
            "is_deleted",
            "is_deleted_for_me",
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

    def get_reply_to(self, obj):
        if not getattr(obj, "reply_to_id", None):
            return None
        try:
            rt = obj.reply_to
        except Exception:  # pragma: no cover
            return None
        if not rt:
            return None
        return {
            "id": rt.id,
            "text": "Message deleted" if getattr(rt, "is_deleted", False) else rt.text,
            "sender": UserSummarySerializer(rt.sender).data if rt.sender_id else None,
        }
    
    def get_attachment_url(self, obj):
        """Return full URL for attachment if it exists"""
        if obj.attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.attachment.url)
            return obj.attachment.url
        return None
    
    def get_is_deleted_for_me(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        deleted_for = obj.deleted_for or []
        return request.user.id in deleted_for

    def get_is_deleted_for_me(self, obj):
        request = self.context.get("request")
        if not request or not getattr(request, "user", None) or not request.user.is_authenticated:
            return False
        try:
            uid = int(request.user.id)
        except Exception:  # pragma: no cover
            return False
        deleted_for = getattr(obj, "deleted_for", None) or []
        return uid in deleted_for

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # If user deleted this message "for me", hide its text entirely.
        if data.get("is_deleted_for_me"):
            data["text"] = None
        # If deleted for everyone, show a standard placeholder.
        elif data.get("is_deleted"):
            data["text"] = "Message deleted"
        return data


class ChatMessageCreateSerializer(serializers.ModelSerializer):
    reply_to_message_id = serializers.IntegerField(
        write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = ChatMessage
        fields = ("text", "reply_to_message_id")

    def validate(self, data):
        """Validate that either text or attachment is provided"""
        text = data.get('text', '').strip()
        
        # Check if attachment exists in the request
        # Only check FILES if the request is multipart (has files)
        request = self.context.get('request')
        has_attachment = False
        if request:
            # Check content type to avoid UnsupportedMediaType error when sending JSON
            content_type = getattr(request, 'content_type', '')
            if content_type and 'multipart' in content_type:
                try:
                    has_attachment = bool(request.FILES.get('attachment'))
                except Exception:
                    has_attachment = False
        
        # Must have either text or attachment
        if not text and not has_attachment:
            raise serializers.ValidationError({
                "text": "Message must contain either text or an attachment."
            })
        
        # Clean up text
        if text:
            data['text'] = text
        else:
            data['text'] = ''  # Allow empty text if there's an attachment
        
        return data



class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications"""
    from_user = UserSummarySerializer(read_only=True)
    from_username = serializers.CharField(source='from_user.username', read_only=True)
    conversation_id = serializers.IntegerField(source='conversation.id', read_only=True)
    chatroom_access_request_id = serializers.IntegerField(source='chatroom_access_request.id', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'notification_type',
            'title',
            'message',
            'from_user',
            'from_username',
            'conversation_id',
            'chatroom_access_request_id',
            'is_read',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']



class ChatroomSerializer(serializers.ModelSerializer):
    """Serializer for Chatroom"""
    created_by = UserSummarySerializer(read_only=True)
    participant_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Chatroom
        fields = [
            'id',
            'name',
            'conversation',
            'pet_id',
            'pet_unique_id',
            'pet_kind',
            'purpose',
            'created_by',
            'created_at',
            'updated_at',
            'is_active',
            'participant_count',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_participant_count(self, obj):
        return obj.participants.filter(is_active=True).count()


class ChatroomParticipantSerializer(serializers.ModelSerializer):
    """Serializer for Chatroom Participant"""
    user = UserSummarySerializer(read_only=True)
    
    class Meta:
        model = ChatroomParticipant
        fields = [
            'id',
            'chatroom',
            'user',
            'role',
            'joined_at',
            'is_active',
        ]
        read_only_fields = ['id', 'joined_at']


class ChatroomAccessRequestSerializer(serializers.ModelSerializer):
    """Serializer for Chatroom Access Request"""
    requested_user = UserSummarySerializer(read_only=True)
    added_by = UserSummarySerializer(read_only=True)
    chatroom_name = serializers.SerializerMethodField()
    pet_name = serializers.SerializerMethodField()
    pet_type = serializers.SerializerMethodField()
    pet_breed = serializers.SerializerMethodField()
    pet_image = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatroomAccessRequest
        fields = [
            'id',
            'chatroom',
            'chatroom_name',
            'pet',
            'pet_unique_id',
            'pet_kind',
            'pet_name',
            'pet_type',
            'pet_breed',
            'pet_image',
            'requested_user',
            'added_by',
            'role',
            'request_type',
            'status',
            'created_at',
            'responded_at',
        ]
        read_only_fields = ['id', 'created_at', 'responded_at']
    
    def get_chatroom_name(self, obj):
        """Get chatroom name or generate one for creation requests"""
        if obj.chatroom:
            return obj.chatroom.name
        # For creation requests, generate a preview name
        if obj.request_type == 'chatroom_creation_request':
            pet_name = self.get_pet_name(obj)
            return f"{pet_name} - {obj.pet_kind.capitalize() if obj.pet_kind else 'Pet'} Case"
        return None
    
    def get_pet_name(self, obj):
        """Get pet name from LostPetReport or FoundPetReport"""
        if obj.pet:
            return getattr(obj.pet, 'pet_name', '') or f"{obj.pet.pet_type}"
        # Try to fetch from pet_unique_id
        if obj.pet_unique_id:
            if obj.pet_kind == 'lost':
                from .models import LostPetReport
                try:
                    pet = LostPetReport.objects.get(pet_unique_id=obj.pet_unique_id)
                    return pet.pet_name or pet.pet_type
                except LostPetReport.DoesNotExist:
                    pass
            elif obj.pet_kind == 'found':
                from .models import FoundPetReport
                try:
                    pet = FoundPetReport.objects.get(pet_unique_id=obj.pet_unique_id)
                    return pet.pet_type
                except FoundPetReport.DoesNotExist:
                    pass
        return "Unknown Pet"
    
    def get_pet_type(self, obj):
        """Get pet type"""
        if obj.pet:
            return obj.pet.pet_type
        if obj.pet_unique_id:
            if obj.pet_kind == 'lost':
                from .models import LostPetReport
                try:
                    pet = LostPetReport.objects.get(pet_unique_id=obj.pet_unique_id)
                    return pet.pet_type
                except LostPetReport.DoesNotExist:
                    pass
            elif obj.pet_kind == 'found':
                from .models import FoundPetReport
                try:
                    pet = FoundPetReport.objects.get(pet_unique_id=obj.pet_unique_id)
                    return pet.pet_type
                except FoundPetReport.DoesNotExist:
                    pass
        return "Unknown"
    
    def get_pet_breed(self, obj):
        """Get pet breed"""
        if obj.pet:
            return getattr(obj.pet, 'breed', '')
        if obj.pet_unique_id:
            if obj.pet_kind == 'lost':
                from .models import LostPetReport
                try:
                    pet = LostPetReport.objects.get(pet_unique_id=obj.pet_unique_id)
                    return pet.breed or ''
                except LostPetReport.DoesNotExist:
                    pass
            elif obj.pet_kind == 'found':
                from .models import FoundPetReport
                try:
                    pet = FoundPetReport.objects.get(pet_unique_id=obj.pet_unique_id)
                    return pet.breed or ''
                except FoundPetReport.DoesNotExist:
                    pass
        return ''
    
    def get_pet_image(self, obj):
        """Get pet image URL"""
        request = self.context.get('request')
        if obj.pet and obj.pet.photo:
            if request:
                return request.build_absolute_uri(obj.pet.photo.url)
            return obj.pet.photo.url
        if obj.pet_unique_id:
            if obj.pet_kind == 'lost':
                from .models import LostPetReport
                try:
                    pet = LostPetReport.objects.get(pet_unique_id=obj.pet_unique_id)
                    if pet.photo:
                        if request:
                            return request.build_absolute_uri(pet.photo.url)
                        return pet.photo.url
                except LostPetReport.DoesNotExist:
                    pass
            elif obj.pet_kind == 'found':
                from .models import FoundPetReport
                try:
                    pet = FoundPetReport.objects.get(pet_unique_id=obj.pet_unique_id)
                    if pet.photo:
                        if request:
                            return request.build_absolute_uri(pet.photo.url)
                        return pet.photo.url
                except FoundPetReport.DoesNotExist:
                    pass
        return None


class ChatroomParticipantSerializer(serializers.ModelSerializer):
    """Serializer for Chatroom Participant"""
    user = UserSummarySerializer(read_only=True)
    
    class Meta:
        model = ChatroomParticipant
        fields = ['id', 'user', 'role', 'joined_at', 'is_active']
        read_only_fields = ['id', 'joined_at']


class ChatroomMessageSerializer(serializers.ModelSerializer):
    """Serializer for Chatroom Message"""
    sender = UserSummarySerializer(read_only=True)
    reply_to = serializers.SerializerMethodField()
    is_deleted_for_me = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatroomMessage
        fields = [
            'id',
            'chatroom',
            'sender',
            'text',
            'reply_to',
            'attachment',
            'attachment_type',
            'attachment_name',
            'attachment_size',
            'attachment_url',
            'is_deleted',
            'is_deleted_for_me',
            'is_system',
            'created_at',
        ]
        read_only_fields = ['id', 'chatroom', 'sender', 'created_at', 'is_deleted', 'is_system', 'attachment_url']
    
    def validate(self, data):
        """Validate that either text or attachment is provided"""
        text = data.get('text', '').strip()
        
        # Check if attachment exists in the request
        # Only check FILES if the request is multipart (has files)
        request = self.context.get('request')
        has_attachment = False
        if request:
            # Check content type to avoid UnsupportedMediaType error when sending JSON
            content_type = getattr(request, 'content_type', '')
            if content_type and 'multipart' in content_type:
                try:
                    has_attachment = bool(request.FILES.get('attachment'))
                except Exception:
                    has_attachment = False
        
        # Must have either text or attachment
        if not text and not has_attachment:
            raise serializers.ValidationError({
                "text": "Message must contain either text or an attachment."
            })
        
        # Clean up text
        if text:
            data['text'] = text
        else:
            data['text'] = ''  # Allow empty text if there's an attachment
        
        return data
    
    def get_reply_to(self, obj):
        if not obj.reply_to:
            return None
        return {
            'id': obj.reply_to.id,
            'text': 'Message deleted' if obj.reply_to.is_deleted else obj.reply_to.text,
            'sender': UserSummarySerializer(obj.reply_to.sender).data if obj.reply_to.sender else None,
        }
    
    def get_is_deleted_for_me(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        deleted_for = obj.deleted_for or []
        return request.user.id in deleted_for
    
    def get_attachment_url(self, obj):
        """Return full URL for attachment if it exists"""
        if obj.attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.attachment.url)
            return obj.attachment.url
        return None
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data.get('is_deleted_for_me'):
            data['text'] = None
        elif data.get('is_deleted'):
            data['text'] = 'Message deleted'
        return data
