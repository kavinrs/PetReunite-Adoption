from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.db.models import Q
from django.utils import dateparse, timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import AuditLog, ChatRoom, ChatRoomMember, Message
from .permissions import IsAdminUserRole, IsRoomMember
from .serializers import (
    AuditLogSerializer,
    ChatRoomMemberSerializer,
    ChatRoomSerializer,
    MessageSerializer,
    UserSerializer,
)


User = get_user_model()


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data or {}
        username = data.get("username") or data.get("email")
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return Response(
                {"ok": False, "error": "email and password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(Q(username=username) | Q(email=email)).exists():
            return Response(
                {"ok": False, "error": "User with this email already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.create(
            username=username,
            email=email,
            password=make_password(password),
        )

        token_serializer = TokenObtainPairSerializer(
            data={"username": username, "password": password}
        )
        token_serializer.is_valid(raise_exception=True)
        tokens = token_serializer.validated_data

        return Response(
            {"ok": True, "user": UserSerializer(user).data, "tokens": tokens},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = TokenObtainPairSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"ok": False, "error": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user = User.objects.filter(
            username=request.data.get("username") or request.data.get("email")
        ).first()
        return Response(
            {
                "ok": True,
                "tokens": serializer.validated_data,
                "user": UserSerializer(user).data if user else None,
            },
            status=status.HTTP_200_OK,
        )


class UserByEmailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        email = request.query_params.get("email")
        if not email:
            return Response(
                {"ok": False, "error": "email query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"ok": False, "error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response({"ok": True, "user": UserSerializer(user).data})


class RoomListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        rooms = ChatRoom.objects.filter(
            members__user=request.user, is_active=True
        ).distinct()
        serializer = ChatRoomSerializer(rooms, many=True)
        return Response({"ok": True, "rooms": serializer.data})

    def post(self, request):
        # Admin-only create room
        if not request.user.is_staff:
            return Response(
                {"ok": False, "error": "Admin privileges required"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ChatRoomSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"ok": False, "error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            room = ChatRoom.objects.create(
                title=serializer.validated_data["title"],
                created_by=request.user,
                metadata=serializer.validated_data.get("metadata"),
            )
            ChatRoomMember.objects.create(
                room=room,
                user=request.user,
                added_by=request.user,
                role=ChatRoomMember.ROLE_ADMIN,
            )
            AuditLog.objects.create(
                actor=request.user,
                action=AuditLog.ACTION_ROOM_CREATED,
                target_type="ChatRoom",
                target_id=room.id,
                detail={"title": room.title},
            )

        return Response(
            {"ok": True, "room": ChatRoomSerializer(room).data},
            status=status.HTTP_201_CREATED,
        )


class RoomDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsRoomMember]

    def get(self, request, room_id):
        try:
            room = ChatRoom.objects.get(id=room_id, is_active=True)
        except ChatRoom.DoesNotExist:
            return Response(
                {"ok": False, "error": "Room not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        members = ChatRoomMember.objects.filter(room=room)
        return Response(
            {
                "ok": True,
                "room": ChatRoomSerializer(room).data,
                "members": ChatRoomMemberSerializer(members, many=True).data,
            }
        )

    def delete(self, request, room_id):
        # Soft-delete room, admin only
        if not request.user.is_staff:
            return Response(
                {"ok": False, "error": "Admin privileges required"},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            room = ChatRoom.objects.get(id=room_id, is_active=True)
        except ChatRoom.DoesNotExist:
            return Response(
                {"ok": False, "error": "Room not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        room.is_active = False
        room.save(update_fields=["is_active", "updated_at"])

        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.ACTION_ROOM_DELETED,
            target_type="ChatRoom",
            target_id=room.id,
            detail={"title": room.title},
        )

        return Response({"ok": True})


class RoomMemberAddView(APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request, room_id):
        user_id = request.data.get("user_id")
        if not user_id:
            return Response(
                {"ok": False, "error": "user_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            room = ChatRoom.objects.get(id=room_id, is_active=True)
        except ChatRoom.DoesNotExist:
            return Response(
                {"ok": False, "error": "Room not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"ok": False, "error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        member, created = ChatRoomMember.objects.get_or_create(
            room=room,
            user=user,
            defaults={
                "added_by": request.user,
                "role": ChatRoomMember.ROLE_PARTICIPANT,
            },
        )

        if not created:
            return Response(
                {"ok": False, "error": "User is already a member"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.ACTION_MEMBER_ADDED,
            target_type="ChatRoomMember",
            target_id=member.id,
            detail={"room_id": str(room.id), "user_id": str(user.id)},
        )

        return Response(
            {"ok": True, "member": ChatRoomMemberSerializer(member).data},
            status=status.HTTP_201_CREATED,
        )


class RoomMemberRemoveView(APIView):
    permission_classes = [IsAdminUserRole]

    def delete(self, request, room_id, user_id):
        try:
            room = ChatRoom.objects.get(id=room_id, is_active=True)
        except ChatRoom.DoesNotExist:
            return Response(
                {"ok": False, "error": "Room not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        try:
            member = ChatRoomMember.objects.get(room=room, user_id=user_id)
        except ChatRoomMember.DoesNotExist:
            return Response(
                {"ok": False, "error": "Member not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        member_id = member.id
        member.delete()

        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.ACTION_MEMBER_REMOVED,
            target_type="ChatRoomMember",
            target_id=member_id,
            detail={"room_id": str(room.id), "user_id": str(user_id)},
        )

        return Response({"ok": True})


class RoomMessageListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsRoomMember]

    def get(self, request, room_id):
        limit = int(request.query_params.get("limit", 50))
        before = request.query_params.get("before")

        qs = Message.objects.filter(room_id=room_id).order_by("-created_at")
        if before:
            before_dt = dateparse.parse_datetime(before)
            if before_dt is not None:
                if timezone.is_naive(before_dt):
                    before_dt = timezone.make_aware(before_dt, timezone.utc)
                qs = qs.filter(created_at__lt=before_dt)

        qs = qs[:limit]
        messages = list(qs)[::-1]  # return oldest->newest

        serializer = MessageSerializer(
            messages, many=True, context={"request": request}
        )
        return Response({"ok": True, "messages": serializer.data})

    def post(self, request, room_id):
        try:
            room = ChatRoom.objects.get(id=room_id, is_active=True)
        except ChatRoom.DoesNotExist:
            return Response(
                {"ok": False, "error": "Room not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        content = request.data.get("content")
        content_type = request.data.get("content_type", Message.CONTENT_TEXT)
        attachments = request.data.get("attachments")

        if not content and not attachments:
            return Response(
                {"ok": False, "error": "content or attachments are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        message = Message.objects.create(
            room=room,
            sender=request.user,
            content=content,
            content_type=content_type,
            attachments=attachments,
        )

        serializer = MessageSerializer(message, context={"request": request})
        return Response(
            {"ok": True, "message": serializer.data},
            status=status.HTTP_201_CREATED,
        )


class MessageDeleteView(APIView):
    permission_classes = [IsAdminUserRole]

    def delete(self, request, message_id):
        try:
            message = Message.objects.get(id=message_id)
        except Message.DoesNotExist:
            return Response(
                {"ok": False, "error": "Message not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        message.is_deleted = True
        message.save(update_fields=["is_deleted", "updated_at"])

        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.ACTION_MESSAGE_DELETED,
            target_type="Message",
            target_id=message.id,
            detail={"room_id": str(message.room_id)},
        )

        # WebSocket broadcast can be added via channel layer if needed
        return Response({"ok": True})