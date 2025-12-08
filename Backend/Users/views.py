# users/views.py
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import parsers

from .serializers import (
    RegisterSerializer,
    UserProfileSerializer,
    # FoundPetReportSerializer,
    # LostPetReportSerializer,
)
from .models import UserProfile
#  FoundPetReport, LostPetReport
from django.contrib.auth import authenticate, get_user_model
from rest_framework_simplejwt.tokens import RefreshToken


class RegisterView(APIView):

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {
                    "ok": True,
                    "message": "User registered successfully",
                    "user": {
                        "username": user.username,
                        "email": user.email,
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        # ERROR FIX – send consistent JSON
        return Response(
            {
                "ok": False,
                "message": "Registration failed",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile, context={"request": request})
        return Response(serializer.data)

    def patch(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)

        # Prevent normal users from changing restricted fields client-side
        request.data.pop("role", None)
        request.data.pop("verified", None)

        serializer = UserProfileSerializer(profile, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AdminLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"detail": "Username and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=username, password=password)

        if not user:
            return Response({"detail": "Invalid credentials."},
                            status=status.HTTP_401_UNAUTHORIZED)

        # Admin access check
        is_admin = user.is_staff or user.is_superuser

        # Optional: also allow user.profile.role == "admin"
        try:
            if hasattr(user, "profile") and user.profile.role == "admin":
                is_admin = True
        except:
            pass

        if not is_admin:
            return Response({"detail": "You are not authorized as admin."},
                            status=status.HTTP_403_FORBIDDEN)

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "username": user.username,
                "is_admin": True
            },
            status=status.HTTP_200_OK
        )


class EmailLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response(
                {"detail": "Email and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        User = get_user_model()
        qs = User.objects.filter(email__iexact=email).order_by("id")
        user_obj = qs.first()
        if not user_obj:
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

        user = authenticate(username=user_obj.username, password=password)
        if not user:
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

        is_admin = user.is_staff or user.is_superuser
        try:
            if hasattr(user, "profile") and user.profile.role == "admin":
                is_admin = True
        except Exception:
            pass

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "username": user.username,
                "email": user.email,
                "is_admin": is_admin,
            },
            status=status.HTTP_200_OK,
        )


# class FoundPetReportView(generics.ListAPIView):
#     serializer_class = FoundPetReportSerializer
#     permission_classes = [permissions.IsAuthenticated]

#     def get_queryset(self):
#         user = self.request.user
#         if user.is_staff or user.is_superuser:
#             return FoundPetReport.objects.all()
#         return FoundPetReport.objects.filter(reporter=user)


# class LostPetReportView(generics.ListAPIView):
#     serializer_class = LostPetReportSerializer
#     permission_classes = [permissions.IsAuthenticated]

#     def get_queryset(self):
#         user = self.request.user
#         if user.is_staff or user.is_superuser:
#             return LostPetReport.objects.all()
#         return LostPetReport.objects.filter(reporter=user)
