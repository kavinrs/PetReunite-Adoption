from rest_framework import permissions

from .models import ChatRoomMember


class IsAdminUserRole(permissions.BasePermission):
    """
    Allow access only to staff/admin users (is_staff == True).
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class IsRoomMember(permissions.BasePermission):
    """
    Allow access only if the user is a member of the given room.
    Expects `room_id` kwarg in the URL.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        room_id = view.kwargs.get("room_id")
        if not room_id:
            return False

        return ChatRoomMember.objects.filter(room_id=room_id, user=user).exists()