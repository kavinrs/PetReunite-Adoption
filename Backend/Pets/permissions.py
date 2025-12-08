from rest_framework.permissions import BasePermission


class IsAdminOrStaff(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
            return True
        try:
            profile = getattr(user, "profile", None)
            if profile and getattr(profile, "role", None) == "admin":
                return True
        except Exception:
            pass
        return False

