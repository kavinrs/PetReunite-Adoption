# users/views.py
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import parsers
from math import radians, cos, sin, asin, sqrt

from .serializers import (
    RegisterSerializer,
    UserProfileSerializer,
    VolunteerRequestCreateSerializer,
    VolunteerRequestListSerializer,
    AdminVolunteerRequestSerializer,
)
from .models import UserProfile, VolunteerRequest
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
        # Backfill missing public id for existing users
        if not getattr(profile, "user_unique_id", None):
            profile.save()
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


class VolunteerRequestView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return VolunteerRequestCreateSerializer
        return VolunteerRequestListSerializer

    def get_queryset(self):
        return VolunteerRequest.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save()


class AdminVolunteerListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = VolunteerRequest.objects.all().order_by("-created_at") if (user.is_staff or user.is_superuser) else VolunteerRequest.objects.filter(user=user).order_by("-created_at")

        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        city = self.request.query_params.get("city")
        if city:
            qs = qs.filter(city__iexact=city)

        state = self.request.query_params.get("state")
        if state:
            qs = qs.filter(state__iexact=state)

        q = (self.request.query_params.get("q") or "").strip().lower()
        if q:
            qs = qs.filter(full_name__icontains=q)

        return qs

    serializer_class = AdminVolunteerRequestSerializer


class AdminVolunteerDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AdminVolunteerRequestSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return VolunteerRequest.objects.all()
        return VolunteerRequest.objects.filter(user=user)


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance in kilometers between two points 
    on the earth (specified in decimal degrees)
    """
    # Convert decimal degrees to radians
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    
    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    
    # Radius of earth in kilometers
    r = 6371
    
    return c * r


class NearbyUsersView(APIView):
    """
    Get users within a specified radius (default 5-10 km) of the current user's location
    Can search from profile location OR custom coordinates
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Get current user's profile
        try:
            user_profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            return Response(
                {"detail": "User profile not found. Please update your profile with location."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if custom lat/lon provided in query params (for temporary search)
        custom_lat = request.query_params.get("lat")
        custom_lon = request.query_params.get("lon")
        
        if custom_lat and custom_lon:
            try:
                search_latitude = float(custom_lat)
                search_longitude = float(custom_lon)
            except ValueError:
                return Response(
                    {"detail": "Invalid latitude or longitude values"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Use profile location
            if not user_profile.latitude or not user_profile.longitude:
                return Response(
                    {
                        "detail": "Location not set. Please update your profile with your location.",
                        "nearby_users": []
                    },
                    status=status.HTTP_200_OK
                )
            search_latitude = user_profile.latitude
            search_longitude = user_profile.longitude

        # Get radius from query params (default 10 km, min 5 km, max 50 km)
        try:
            radius_km = float(request.query_params.get("radius", 10))
            radius_km = max(5, min(radius_km, 50))  # Clamp between 5 and 50 km
        except ValueError:
            radius_km = 10

        # Get all users with location data (excluding current user)
        # Only show users whose PROFILE location is set
        all_profiles = UserProfile.objects.filter(
            latitude__isnull=False,
            longitude__isnull=False
        ).exclude(user=request.user).select_related('user')

        nearby_users = []
        
        for profile in all_profiles:
            # Calculate distance from search location to user's PROFILE location
            distance = haversine_distance(
                search_latitude,
                search_longitude,
                profile.latitude,  # User's profile location
                profile.longitude  # User's profile location
            )

            # If within radius, add to results
            if distance <= radius_km:
                nearby_users.append({
                    "user_unique_id": profile.user_unique_id,
                    "user_id": profile.user.id,
                    "full_name": profile.full_name,
                    "username": profile.user.username,
                    "city": profile.city,
                    "state": profile.state,
                    "profile_photo": request.build_absolute_uri(profile.profile_photo.url) if profile.profile_photo else None,
                    "distance_km": round(distance, 2),
                    "role": profile.role,
                })

        # Sort by distance (closest first)
        nearby_users.sort(key=lambda x: x["distance_km"])

        # Determine what location info to return
        if custom_lat and custom_lon:
            # Custom search location
            location_info = {
                "city": "Custom Location",
                "state": "",
                "latitude": search_latitude,
                "longitude": search_longitude,
            }
        else:
            # Profile location
            location_info = {
                "city": user_profile.city,
                "state": user_profile.state,
                "latitude": search_latitude,
                "longitude": search_longitude,
            }

        return Response({
            "count": len(nearby_users),
            "radius_km": radius_km,
            "your_location": location_info,
            "nearby_users": nearby_users,
            "search_from_profile": custom_lat is None and custom_lon is None,
        })
