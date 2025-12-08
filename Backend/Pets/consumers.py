import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist

from .models import AdoptionRequest, Message
from .serializers import MessageSerializer

User = get_user_model()


class AdoptionChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.adoption_request_id = self.scope["url_route"]["kwargs"][
            "adoption_request_id"
        ]
        self.room_group_name = f"adopt_{self.adoption_request_id}"

        # Check if user is authenticated
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close()
            return

        # Check if user has permission to access this adoption request
        has_permission = await self.check_permission()
        if not has_permission:
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # Receive message from WebSocket
    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_text = text_data_json.get("message", "").strip()

            if not message_text:
                await self.send(
                    text_data=json.dumps({"error": "Message cannot be empty"})
                )
                return

            # Check permission again before saving
            has_permission = await self.check_permission()
            if not has_permission:
                await self.send(text_data=json.dumps({"error": "Permission denied"}))
                return

            # Save message to database
            message = await self.save_message(message_text)

            if message:
                # Serialize message for broadcasting
                message_data = await self.serialize_message(message)

                # Send message to room group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {"type": "chat_message", "message_data": message_data},
                )
            else:
                await self.send(
                    text_data=json.dumps({"error": "Failed to save message"})
                )

        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({"error": "Invalid JSON format"}))
        except Exception as e:
            await self.send(
                text_data=json.dumps({"error": f"Unexpected error: {str(e)}"})
            )

    # Receive message from room group
    async def chat_message(self, event):
        message_data = event["message_data"]

        # Send message to WebSocket
        await self.send(
            text_data=json.dumps({"type": "chat_message", "message": message_data})
        )

    @database_sync_to_async
    def check_permission(self):
        """Check if user has permission to access this adoption request"""
        try:
            adoption_request = AdoptionRequest.objects.get(id=self.adoption_request_id)
            return (
                self.user == adoption_request.requester
                or self.user.is_staff
                or self.user.is_superuser
            )
        except ObjectDoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, message_text):
        """Save message to database"""
        try:
            adoption_request = AdoptionRequest.objects.get(id=self.adoption_request_id)
            message = Message.objects.create(
                adoption_request=adoption_request, sender=self.user, text=message_text
            )
            return message
        except Exception as e:
            print(f"Error saving message: {e}")
            return None

    @database_sync_to_async
    def serialize_message(self, message):
        """Serialize message for JSON response"""
        try:
            serializer = MessageSerializer(message)
            return serializer.data
        except Exception as e:
            print(f"Error serializing message: {e}")
            return None


class NotificationConsumer(AsyncWebsocketConsumer):
    """Consumer for general notifications (new adoption requests, status updates, etc.)"""

    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close()
            return

        # Admin users join admin notification group
        if self.user.is_staff or self.user.is_superuser:
            self.notification_group_name = "admin_notifications"
        else:
            # Regular users join their personal notification group
            self.notification_group_name = f"user_{self.user.id}_notifications"

        # Join notification group
        await self.channel_layer.group_add(
            self.notification_group_name, self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave notification group
        await self.channel_layer.group_discard(
            self.notification_group_name, self.channel_name
        )

    async def receive(self, text_data):
        # Handle any client-side notification requests if needed
        pass

    # Receive notification from group
    async def send_notification(self, event):
        notification_data = event["notification_data"]

        # Send notification to WebSocket
        await self.send(
            text_data=json.dumps(
                {"type": "notification", "notification": notification_data}
            )
        )
