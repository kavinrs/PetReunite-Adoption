import urllib.parse

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

from .models import ChatRoom, ChatRoomMember, Message
from .serializers import MessageSerializer


User = get_user_model()


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """JWT-authenticated room chat consumer.

    - Expects URL: /ws/chat/<room_id>/?token=<JWT>
    - Authenticates user via SimpleJWT access token.
    - Ensures user is a member of the room before accepting.
    - Handles `send_message` events to persist and broadcast messages.
    """

    async def connect(self):
        self.room_id = str(self.scope["url_route"]["kwargs"]["room_id"])
        self.room_group_name = f"room_{self.room_id}"

        query_string = self.scope.get("query_string", b"").decode()
        query_params = urllib.parse.parse_qs(query_string)
        token_list = query_params.get("token") or []
        token = token_list[0] if token_list else None

        if not token:
            await self.close(code=4001)
            return

        user = await self._get_user_from_token(token)
        if not user:
            await self.close(code=4003)
            return

        self.scope["user"] = user

        is_member = await self._is_room_member(user, self.room_id)
        if not is_member:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        event_type = content.get("type")
        if event_type == "send_message":
            await self._handle_send_message(content)

    async def _handle_send_message(self, content):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.send_json({"type": "error", "error": "Authentication required"})
            return

        text = content.get("content")
        content_type = content.get("content_type", Message.CONTENT_TEXT)
        attachments = content.get("attachments")

        if not text and not attachments:
            await self.send_json(
                {"type": "error", "error": "content or attachments are required"}
            )
            return

        message = await self._create_message(
            room_id=self.room_id,
            sender=user,
            content=text,
            content_type=content_type,
            attachments=attachments,
        )

        serialized = MessageSerializer(
            message, context={"request": self._fake_request(user)}
        ).data

        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "chat.message", "event": "message_created", "message": serialized},
        )

    async def chat_message(self, event):
        await self.send_json(event)

    @database_sync_to_async
    def _get_user_from_token(self, token_str):
        try:
            token = AccessToken(token_str)
            user_id = token["user_id"]
            return User.objects.get(id=user_id)
        except Exception:
            return None

    @database_sync_to_async
    def _is_room_member(self, user, room_id):
        return ChatRoomMember.objects.filter(room_id=room_id, user=user).exists()

    @database_sync_to_async
    def _create_message(self, room_id, sender, content, content_type, attachments):
        room = ChatRoom.objects.get(id=room_id, is_active=True)
        return Message.objects.create(
            room=room,
            sender=sender,
            content=content,
            content_type=content_type,
            attachments=attachments,
        )

    def _fake_request(self, user):
        class _Req:
            def __init__(self, u):
                self.user = u

        return _Req(user)