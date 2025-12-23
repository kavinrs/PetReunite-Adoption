from django.conf import settings
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Count
from django.contrib.auth import get_user_model
from rest_framework import generics, parsers, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    STATUS_CHOICES,
    AdoptionRequest,
    ChatMessage,
    Chatroom,
    ChatroomMessage,
    ChatroomParticipant,
    Conversation,
    FoundPetReport,
    LostPetReport,
    Message,
    Pet,
    Notification,
)
from .serializers import (
    AdminAdoptionRequestSerializer,
    AdminFoundPetReportSerializer,
    AdminLostPetReportSerializer,
    AdoptionRequestCreateSerializer,
    AdoptionRequestListSerializer,
    AdoptionRequestSerializer,
    ChatMessageCreateSerializer,
    ChatMessageSerializer,
    ConversationCreateSerializer,
    ConversationSerializer,
    FoundPetReportSerializer,
    LostPetReportSerializer,
    MessageCreateSerializer,
    MessageSerializer,
    PetSerializer,
    NotificationSerializer,
    ChatroomSerializer,
    ChatroomParticipantSerializer,
    ChatroomAccessRequestSerializer,
    ChatroomMessageSerializer,
)
from .permissions import IsAdminOrStaff


User = get_user_model()


class FoundPetReportView(generics.ListCreateAPIView):
    serializer_class = FoundPetReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return FoundPetReport.objects.all()
        return FoundPetReport.objects.filter(reporter=user)

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)


class LostPetReportDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = LostPetReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return LostPetReport.objects.all()
        return LostPetReport.objects.filter(reporter=user)

    def perform_update(self, serializer):
        """When an already-reviewed report is edited, flag it as updated.

        We capture a lightweight snapshot of the previous values so the admin can
        compare "before" vs "after" in the dashboard. This runs for both
        normal users and staff accounts, which keeps behaviour consistent even
        if an admin happens to update from the user view.
        """
        instance = self.get_object()
        if instance.status != "pending":
            # If there is no snapshot yet, capture the current values so admin
            # can always see what changed, even if has_user_update was toggled
            # earlier (for example, via manual DB edits).
            if not instance.previous_snapshot:
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
                    "description": instance.description,
                }
                instance.save(update_fields=["previous_snapshot"])
            instance.has_user_update = True
            instance.save(update_fields=["has_user_update"])

        serializer.save()


class FoundPetReportDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = FoundPetReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return FoundPetReport.objects.all()
        return FoundPetReport.objects.filter(reporter=user)

    def perform_update(self, serializer):
        """When an already-reviewed found report is edited, flag it as updated.

        Mirrors LostPetReportDetailView so admins can see before/after details
        for found reports as well.
        """
        instance = self.get_object()
        if instance.status != "pending":
            if not instance.previous_snapshot:
                instance.previous_snapshot = {
                    "pet_name": instance.pet_name,
                    "pet_type": instance.pet_type,
                    "breed": instance.breed,
                    "color": instance.color,
                    "weight": instance.weight,
                    "estimated_age": instance.estimated_age,
                    "found_city": instance.found_city,
                    "state": instance.state,
                    "pincode": instance.pincode,
                    "location_url": instance.location_url,
                    "description": instance.description,
                }
                instance.save(update_fields=["previous_snapshot"])
            instance.has_user_update = True
            instance.save(update_fields=["has_user_update"])

        serializer.save()


class LostPetReportView(generics.ListCreateAPIView):
    serializer_class = LostPetReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return LostPetReport.objects.all()
        return LostPetReport.objects.filter(reporter=user)

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)


class AllReportsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Show all approved pets for public viewing in dashboard
        # Exclude found pets that have been converted to adoption to avoid duplicates
        found = FoundPetReportSerializer(
            FoundPetReport.objects.filter(
                status__in=["approved", "investigating", "matched"],
                converted_to_adoption=False
            ).order_by("-created_at"),
            many=True,
        ).data
        lost = LostPetReportSerializer(
            LostPetReport.objects.filter(
                status__in=["approved", "investigating", "matched"]
            ).order_by("-created_at"),
            many=True,
        ).data
        return Response({"lost": lost, "found": found}, status=status.HTTP_200_OK)


class PublicLostPetsView(generics.ListAPIView):
    """Public view of approved lost pets for dashboard display.

    Only shows approved lost pet reports to regular users.
    Pending reports are only visible to admins in the admin panel.
    """

    serializer_class = LostPetReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Show latest 20 approved lost reports only
        return LostPetReport.objects.filter(
            status="approved"
        ).order_by("-created_at")[:20]


class PublicFoundPetsView(generics.ListAPIView):
    """Public view of approved found pets for dashboard display.

    Only shows approved found pet reports to regular users.
    Pending reports are only visible to admins in the admin panel.
    Excludes found pets that have been converted to adoption.
    """

    serializer_class = FoundPetReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Show latest 20 approved found reports only
        # Exclude pets that have been converted to adoption to avoid duplicates
        return FoundPetReport.objects.filter(
            status="approved",
            converted_to_adoption=False
        ).order_by("-created_at")[:20]


class AdminReportSummaryView(APIView):
    """Basic analytics for the admin dashboard."""

    permission_classes = [IsAdminOrStaff]

    def get(self, request):
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        week_start = now - timezone.timedelta(days=7)

        lost_qs = LostPetReport.objects.all()
        found_qs = FoundPetReport.objects.all()

        def status_counts(qs):
            return {code: qs.filter(status=code).count() for code, _ in STATUS_CHOICES}

        # Weekly trend for last 7 days
        days = [now - timezone.timedelta(days=i) for i in range(6, -1, -1)]
        weekly_trend = []
        for d in days:
            start = d.replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timezone.timedelta(days=1)
            weekly_trend.append(
                {
                    "date": start.date().isoformat(),
                    "lost": lost_qs.filter(created_at__gte=start, created_at__lt=end).count(),
                    "found": found_qs.filter(created_at__gte=start, created_at__lt=end).count(),
                }
            )

        # Pet types distribution (top 5 across lost+found)
        type_counts = {}
        for row in lost_qs.values("pet_type").order_by().annotate(c=Count("id")):
            key = (row["pet_type"] or "Unknown").strip()
            type_counts[key] = type_counts.get(key, 0) + row["c"]
        for row in found_qs.values("pet_type").order_by().annotate(c=Count("id")):
            key = (row["pet_type"] or "Unknown").strip()
            type_counts[key] = type_counts.get(key, 0) + row["c"]
        pet_types = (
            sorted(({"name": k, "count": v} for k, v in type_counts.items()), key=lambda x: -x["count"])
        )[:5]

        # Hotspots by city/state (top 8), with separate counts for lost, found, and adoption
        # so the frontend map can render different colored dots.
        hotspot_counts = {}

        def inc_hotspot(key: str, kind: str, count: int):
            if not key:
                return
            entry = hotspot_counts.setdefault(key, {"lost": 0, "found": 0, "adoption": 0})
            entry[kind] = entry.get(kind, 0) + count

        # Lost reports
        for row in (
            lost_qs.values("city", "state").order_by().annotate(c=Count("id"))
        ):
            city = (row.get("city") or "").strip()
            state = (row.get("state") or "").strip()
            key = ", ".join([p for p in [city, state] if p])
            inc_hotspot(key, "lost", row["c"])

        # Found reports
        for row in (
            found_qs.values("found_city", "state").order_by().annotate(c=Count("id"))
        ):
            city = (row.get("found_city") or "").strip()
            state = (row.get("state") or "").strip()
            key = ", ".join([p for p in [city, state] if p])
            inc_hotspot(key, "found", row["c"])

        # Adoption pets (active Pet locations)
        for row in (
            Pet.objects.filter(is_active=True)
            .values("location_city", "location_state")
            .order_by()
            .annotate(c=Count("id"))
        ):
            city = (row.get("location_city") or "").strip()
            state = (row.get("location_state") or "").strip()
            key = ", ".join([p for p in [city, state] if p])
            inc_hotspot(key, "adoption", row["c"])

        hotspots = []
        for loc, kinds in sorted(
            hotspot_counts.items(),
            key=lambda kv: -(
                (kv[1].get("lost", 0))
                + (kv[1].get("found", 0))
                + (kv[1].get("adoption", 0))
            ),
        )[:8]:
            hotspots.append(
                {
                    "location": loc,
                    "lost": kinds.get("lost", 0),
                    "found": kinds.get("found", 0),
                    "adoption": kinds.get("adoption", 0),
                }
            )

        # Recent activity: last 10 updates across lost/found
        recent_lost = list(
            lost_qs.order_by("-updated_at")[:10].values("id", "pet_type", "pet_name", "status", "updated_at")
        )
        recent_found = list(
            found_qs.order_by("-updated_at")[:10].values("id", "pet_type", "status", "updated_at")
        )
        merged = []
        for r in recent_lost:
            merged.append(
                {
                    "kind": "lost",
                    "text": f"{r.get('pet_name') or r.get('pet_type')} - {r.get('status')}",
                    "time": r.get("updated_at"),
                }
            )
        for r in recent_found:
            merged.append(
                {
                    "kind": "found",
                    "text": f"{r.get('pet_type')} - {r.get('status')}",
                    "time": r.get("updated_at"),
                }
            )
        recent_activity = [
            {"text": m["text"], "time": m["time"].isoformat()} for m in sorted(merged, key=lambda x: x["time"], reverse=True)[:10]
        ]

        # System overview metrics
        # Use UserProfile so this matches the Users tab (only active, non-staff users)
        try:
            from Users.models import UserProfile

            total_users = (
                UserProfile.objects.select_related("user")
                .filter(
                    user__is_active=True,
                    user__is_staff=False,
                    user__is_superuser=False,
                )
                .count()
            )
        except Exception:
            # Fallback to active auth users if profiles are unavailable
            total_users = User.objects.filter(is_active=True, is_staff=False, is_superuser=False).count()
        successful_adoptions = AdoptionRequest.objects.filter(status="approved").count()
        new_pets_this_week = Pet.objects.filter(is_active=True, created_at__gte=week_start).count()
        try:
            from Users.models import VolunteerRequest
            volunteers_total = VolunteerRequest.objects.count()
            volunteers_pending = VolunteerRequest.objects.filter(status="pending").count()
        except Exception:
            volunteers_total = 0
            volunteers_pending = 0
        # Total reports that have pending user updates (lost + found)
        update_requests = (
            LostPetReport.objects.filter(has_user_update=True).count()
            + FoundPetReport.objects.filter(has_user_update=True).count()
        )

        data = {
            "lost_total": lost_qs.filter(status="approved").count(),
            "found_total": found_qs.filter(status="approved").count(),
            "lost_this_month": lost_qs.filter(created_at__gte=month_start).count(),
            "found_this_month": found_qs.filter(created_at__gte=month_start).count(),
            "status_breakdown": {
                "lost": status_counts(lost_qs),
                "found": status_counts(found_qs),
            },
            "weekly_trend": weekly_trend,
            "pet_types": pet_types,
            "hotspots": hotspots,
            "recent_activity": recent_activity,
            "total_users": total_users,
            "successful_adoptions": successful_adoptions,
            "new_pets_this_week": new_pets_this_week,
            "volunteers_total": volunteers_total,
            "volunteers_pending": volunteers_pending,
            "update_requests": update_requests,
        }

        return Response(data, status=status.HTTP_200_OK)


class AdminFoundPetListView(generics.ListAPIView):
    serializer_class = AdminFoundPetReportSerializer
    permission_classes = [IsAdminOrStaff]

    def get_queryset(self):
        qs = FoundPetReport.objects.select_related("reporter").all()
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        return qs


class AdminFoundPetDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AdminFoundPetReportSerializer
    permission_classes = [IsAdminOrStaff]
    queryset = FoundPetReport.objects.select_related("reporter").all()


class AdminLostPetListView(generics.ListAPIView):
    serializer_class = AdminLostPetReportSerializer
    permission_classes = [IsAdminOrStaff]

    def get_queryset(self):
        qs = LostPetReport.objects.select_related("reporter").all()
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        return qs


class AdminLostPetDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AdminLostPetReportSerializer
    permission_classes = [IsAdminOrStaff]
    queryset = LostPetReport.objects.select_related("reporter").all()


class EligibleForAdoptionListView(APIView):
    """
    List found pets that are eligible for adoption.
    Criteria: approved status, older than 20 days, not yet converted to adoption.
    """
    permission_classes = [IsAdminOrStaff]

    def get(self, request):
        from datetime import timedelta
        
        # Calculate the cutoff date (20 days ago)
        cutoff_date = timezone.now() - timedelta(days=20)
        
        # Get found pets that are:
        # 1. Approved status
        # 2. Created more than 20 days ago
        # 3. Not yet converted to adoption
        eligible_pets = FoundPetReport.objects.filter(
            status='approved',
            created_at__lte=cutoff_date,
            converted_to_adoption=False
        ).select_related('reporter').order_by('-created_at')
        
        serializer = AdminFoundPetReportSerializer(eligible_pets, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ConvertToAdoptionView(APIView):
    """
    Convert a found pet report to an adoption listing.
    Creates a new Pet entry and marks the found report as converted.
    """
    permission_classes = [IsAdminOrStaff]

    def post(self, request, pk):
        try:
            found_report = FoundPetReport.objects.get(pk=pk)
        except FoundPetReport.DoesNotExist:
            return Response(
                {"error": "Found pet report not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if already converted
        if found_report.converted_to_adoption:
            return Response(
                {"error": "This pet has already been converted to adoption"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if eligible (approved and older than 20 days)
        from datetime import timedelta
        cutoff_date = timezone.now() - timedelta(days=20)
        
        if found_report.status != 'approved':
            return Response(
                {"error": "Only approved found pets can be converted to adoption"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if found_report.created_at > cutoff_date:
            days_remaining = (found_report.created_at + timedelta(days=20) - timezone.now()).days
            return Response(
                {"error": f"This pet is not yet eligible for adoption. {days_remaining} days remaining."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Build photo URL
        photo_url = None
        if found_report.photo:
            photo_url = request.build_absolute_uri(found_report.photo.url)
        
        # Create the adoption pet
        adoption_pet = Pet.objects.create(
            name=found_report.pet_name or f"Found {found_report.pet_type}",
            species=found_report.pet_type,
            breed=found_report.breed or "",
            gender=found_report.gender or "",
            description=found_report.description or f"This {found_report.pet_type} was found and is now available for adoption.",
            age=found_report.estimated_age or "",
            color=found_report.color or "",
            location_city=found_report.found_city,
            location_state=found_report.state,
            photos=photo_url,
            posted_by=request.user,
            is_active=True
        )
        
        # Mark the found report as converted
        found_report.converted_to_adoption = True
        found_report.adoption_pet = adoption_pet
        found_report.save()
        
        # Serialize and return the new adoption pet
        pet_serializer = PetSerializer(adoption_pet)
        
        return Response({
            "message": "Pet successfully added to adoption list",
            "adoption_pet": pet_serializer.data,
            "found_report_id": found_report.id
        }, status=status.HTTP_201_CREATED)


# Adoption Feature Views
class PetDetailView(generics.RetrieveAPIView):
    """Get full pet details for adoption"""

    serializer_class = PetSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Pet.objects.filter(is_active=True).select_related("posted_by")


class AdminPetDetailView(generics.RetrieveAPIView):
    """Admin view to get any pet details (including inactive)"""

    serializer_class = PetSerializer
    permission_classes = [IsAdminOrStaff]
    queryset = Pet.objects.all().select_related("posted_by")


class AdminPetDeleteView(generics.DestroyAPIView):
    """Admin view to delete a pet"""

    serializer_class = PetSerializer
    permission_classes = [IsAdminOrStaff]
    queryset = Pet.objects.all()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        pet_name = instance.name
        self.perform_destroy(instance)
        return Response(
            {"message": f"Pet '{pet_name}' has been deleted successfully."},
            status=status.HTTP_200_OK,
        )


class AdminPetListView(generics.ListAPIView):
    """Admin view to list all pets (including inactive)"""

    serializer_class = PetSerializer
    permission_classes = [IsAdminOrStaff]
    queryset = Pet.objects.all().select_related("posted_by")


class PetListView(generics.ListAPIView):
    """List all available pets for adoption"""

    serializer_class = PetSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Pet.objects.filter(is_active=True).select_related("posted_by")


class CreateAdoptionRequestView(APIView):
    """Create adoption request for a specific pet"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pet_id):
        pet = get_object_or_404(Pet, id=pet_id, is_active=True)

        # Check if user already has a request for this pet
        existing_request = AdoptionRequest.objects.filter(
            pet=pet, requester=request.user
        ).first()

        if existing_request:
            return Response(
                {"error": "You already have a request for this pet."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AdoptionRequestCreateSerializer(data=request.data)
        if serializer.is_valid():
            adoption_request = serializer.save(pet=pet, requester=request.user)

            # Send email notification to admin
            self.send_admin_notification(adoption_request)

            # Return full adoption request data
            response_serializer = AdoptionRequestSerializer(adoption_request)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def send_admin_notification(self, adoption_request):
        """Send email notification to admin about new adoption request"""
        try:
            subject = f"New Adoption Request for {adoption_request.pet.name}"
            message = f"""
A new adoption request has been submitted:

Pet: {adoption_request.pet.name} ({adoption_request.pet.species})
Requester: {adoption_request.requester.username} ({adoption_request.requester.email})
Phone: {adoption_request.phone}
Address: {adoption_request.address}
Reason: {adoption_request.reason_for_adopting}

Review the request in the admin panel.
            """

            admin_emails = [email for name, email in settings.ADMINS]
            if admin_emails:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=admin_emails,
                    fail_silently=True,
                )
        except Exception as e:
            print(f"Failed to send admin notification: {e}")


class AdoptionRequestListView(generics.ListAPIView):
    """List adoption requests - admin sees all, users see their own"""

    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.user.is_staff or self.request.user.is_superuser:
            return AdoptionRequestListSerializer
        return AdoptionRequestSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return AdoptionRequest.objects.select_related("pet", "pet__posted_by", "requester").all()
        return AdoptionRequest.objects.filter(requester=user).select_related("pet", "pet__posted_by")


class AdoptionRequestDetailView(generics.RetrieveAPIView):
    """Get adoption request details"""

    serializer_class = AdoptionRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return AdoptionRequest.objects.select_related("pet", "pet__posted_by", "requester").all()
        return AdoptionRequest.objects.filter(requester=user).select_related("pet", "pet__posted_by")


class AdminUpdateAdoptionRequestView(generics.RetrieveUpdateDestroyAPIView):
    """Admin update adoption request status"""

    serializer_class = AdminAdoptionRequestSerializer
    permission_classes = [IsAdminOrStaff]
    queryset = AdoptionRequest.objects.all()

    def perform_update(self, serializer):
        adoption_request = self.get_object()
        old_status = adoption_request.status

        instance = serializer.save()

        # If approved, mark the pet as inactive (adopted) so it doesn't show in listings
        if instance.status == "approved" and old_status != "approved":
            pet = instance.pet
            if pet:
                pet.is_active = False
                pet.save()

        # Send email notification if status changed
        if old_status != instance.status:
            self.send_status_notification(instance)

    def send_status_notification(self, adoption_request):
        """Send email notification to requester about status change"""
        try:
            subject = f"Adoption Request Update for {adoption_request.pet.name}"

            status_messages = {
                "approved": "Great news! Your adoption request has been approved.",
                "rejected": "We're sorry, but your adoption request was not approved this time.",
            }

            message = f"""
Hello {adoption_request.requester.username},

{status_messages.get(adoption_request.status, "Your adoption request status has been updated.")}

Pet: {adoption_request.pet.name}
Status: {adoption_request.get_status_display()}

{f"Admin Notes: {adoption_request.admin_notes}" if adoption_request.admin_notes else ""}

You can view your request and chat with the admin at: [Your App URL]

Best regards,
PetReunite Team
            """

            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[adoption_request.requester.email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Failed to send status notification: {e}")


class MessageListView(generics.ListAPIView):
    """List messages for an adoption request"""

    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        adoption_request_id = self.kwargs.get("adoption_request_id")
        adoption_request = get_object_or_404(AdoptionRequest, id=adoption_request_id)

        # Check permissions - only requester or admin can view messages
        user = self.request.user
        if not (
            user == adoption_request.requester or user.is_staff or user.is_superuser
        ):
            return Message.objects.none()

        return Message.objects.filter(adoption_request=adoption_request).select_related(
            "sender"
        )


class UserConversationListCreateView(generics.ListCreateAPIView):
    """List/create conversations for the current user (regular users only)."""

    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ConversationCreateSerializer
        return ConversationSerializer

    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # ConversationCreateSerializer.create uses request.user, but we keep this
        # to mirror DRF patterns.
        serializer.save()


class UserConversationConfirmView(APIView):
    """User confirms a conversation after admin has accepted (pending_user → active)."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        convo = get_object_or_404(Conversation, pk=pk, user=request.user)
        if convo.status != "pending_user":
            return Response({"detail": "Conversation is not awaiting confirmation."}, status=status.HTTP_400_BAD_REQUEST)

        convo.status = "active"
        convo.save(update_fields=["status", "updated_at"])

        ChatMessage.objects.create(
            conversation=convo,
            sender=request.user,
            text="User joined the chat.",
            is_system=True,
        )
        return Response(ConversationSerializer(convo).data, status=status.HTTP_200_OK)


class UserChatMessageListCreateView(generics.ListCreateAPIView):
    """List/send messages in a conversation for the owning user."""

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ChatMessageCreateSerializer
        return ChatMessageSerializer

    def get_queryset(self):
        convo_id = self.kwargs["conversation_id"]
        convo = get_object_or_404(Conversation, pk=convo_id, user=self.request.user)
        return convo.messages.select_related("sender")

    def perform_create(self, serializer):
        import mimetypes
        
        convo_id = self.kwargs["conversation_id"]
        convo = get_object_or_404(Conversation, pk=convo_id, user=self.request.user)
        if convo.status != "active":
            raise permissions.PermissionDenied("Conversation is not active.")
        
        reply_to_id = self.request.data.get("reply_to_message_id")
        reply_to = None
        if reply_to_id not in (None, "", "null"):
            try:
                # Convert to int if it's a string
                reply_to_id_int = int(reply_to_id) if isinstance(reply_to_id, str) else reply_to_id
                reply_to = get_object_or_404(
                    ChatMessage, pk=reply_to_id_int, conversation=convo
                )
            except (ValueError, TypeError) as e:
                # Log but don't fail if reply_to_id is not a valid integer
                print(f"Invalid reply_to_id format: {reply_to_id}, error: {e}")
            except Exception as e:
                # Log but don't fail if reply_to is invalid
                print(f"Invalid reply_to_id: {reply_to_id}, error: {e}")
        
        # Handle file attachment
        attachment_file = self.request.FILES.get('attachment')
        attachment_type = None
        attachment_name = None
        attachment_size = None
        
        if attachment_file:
            attachment_name = attachment_file.name
            attachment_size = attachment_file.size
            
            # Determine attachment type based on MIME type
            mime_type, _ = mimetypes.guess_type(attachment_name)
            if mime_type:
                if mime_type.startswith('image/'):
                    attachment_type = 'image'
                elif mime_type.startswith('video/'):
                    attachment_type = 'video'
                elif attachment_name.endswith(('.zip', '.tar', '.gz', '.rar')):
                    attachment_type = 'folder'
                else:
                    attachment_type = 'document'
            else:
                attachment_type = 'document'
        
        try:
            serializer.save(
                conversation=convo,
                sender=self.request.user,
                reply_to=reply_to,
                attachment=attachment_file,
                attachment_type=attachment_type,
                attachment_name=attachment_name,
                attachment_size=attachment_size
            )
        except Exception as e:
            print(f"Error saving message: {e}")
            print(f"Request data: {self.request.data}")
            print(f"Request FILES: {self.request.FILES}")
            raise


class AdminChatMessageListCreateView(generics.ListCreateAPIView):
    """List/send messages in a conversation for admins.

    This mirrors UserChatMessageListCreateView but uses admin permissions and
    does not restrict by owning user. It is used by the admin chat UI to see
    and reply to user conversations.
    """

    permission_classes = [IsAdminOrStaff]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ChatMessageCreateSerializer
        return ChatMessageSerializer

    def get_queryset(self):
        convo_id = self.kwargs["conversation_id"]
        convo = get_object_or_404(Conversation, pk=convo_id)
        return convo.messages.select_related("sender")

    def perform_create(self, serializer):
        import mimetypes
        
        convo_id = self.kwargs["conversation_id"]
        convo = get_object_or_404(Conversation, pk=convo_id)
        # Admin can message in active or waiting(read_only) states (and also while
        # waiting for user confirmation).
        if convo.status not in ("active", "read_only", "pending_user"):
            raise permissions.PermissionDenied("Conversation is not active.")
        # Optionally claim the conversation for this admin if not already set.
        if convo.admin_id is None:
            convo.admin = self.request.user
            convo.save(update_fields=["admin", "updated_at"])
        
        reply_to_id = self.request.data.get("reply_to_message_id")
        reply_to = None
        if reply_to_id not in (None, "", "null"):
            try:
                # Convert to int if it's a string
                reply_to_id_int = int(reply_to_id) if isinstance(reply_to_id, str) else reply_to_id
                reply_to = get_object_or_404(
                    ChatMessage, pk=reply_to_id_int, conversation=convo
                )
            except (ValueError, TypeError) as e:
                # Log but don't fail if reply_to_id is not a valid integer
                print(f"Invalid reply_to_id format: {reply_to_id}, error: {e}")
            except Exception as e:
                # Log but don't fail if reply_to is invalid
                print(f"Invalid reply_to_id: {reply_to_id}, error: {e}")
        
        # Handle file attachment
        attachment_file = self.request.FILES.get('attachment')
        attachment_type = None
        attachment_name = None
        attachment_size = None
        
        if attachment_file:
            attachment_name = attachment_file.name
            attachment_size = attachment_file.size
            
            # Determine attachment type based on MIME type
            mime_type, _ = mimetypes.guess_type(attachment_name)
            if mime_type:
                if mime_type.startswith('image/'):
                    attachment_type = 'image'
                elif mime_type.startswith('video/'):
                    attachment_type = 'video'
                elif attachment_name.endswith(('.zip', '.tar', '.gz', '.rar')):
                    attachment_type = 'folder'
                else:
                    attachment_type = 'document'
            else:
                attachment_type = 'document'
        
        try:
            serializer.save(
                conversation=convo,
                sender=self.request.user,
                reply_to=reply_to,
                attachment=attachment_file,
                attachment_type=attachment_type,
                attachment_name=attachment_name,
                attachment_size=attachment_size
            )
        except Exception as e:
            print(f"Error saving admin message: {e}")
            print(f"Request data: {self.request.data}")
            print(f"Request FILES: {self.request.FILES}")
            raise


class AdminConversationListView(generics.ListAPIView):
    """List conversations for admins with optional status filter."""

    permission_classes = [IsAdminOrStaff]
    serializer_class = ConversationSerializer

    def get_queryset(self):
        qs = Conversation.objects.select_related("user", "admin")
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        return qs


class AdminConversationAcceptView(APIView):
    """Admin accepts a requested conversation (requested → pending_user)."""

    permission_classes = [IsAdminOrStaff]

    def post(self, request, pk):
        convo = get_object_or_404(Conversation, pk=pk)
        if convo.status != "requested":
            return Response({"detail": "Conversation is not in requested state."}, status=status.HTTP_400_BAD_REQUEST)

        convo.admin = request.user
        convo.status = "pending_user"
        convo.save(update_fields=["admin", "status", "updated_at"])

        ChatMessage.objects.create(
            conversation=convo,
            sender=request.user,
            text="Admin accepted the chat request.",
            is_system=True,
        )
        return Response(ConversationSerializer(convo).data, status=status.HTTP_200_OK)


class AdminConversationCloseView(APIView):
    """Admin closes a conversation (any non-closed → closed)."""

    permission_classes = [IsAdminOrStaff]

    def post(self, request, pk):
        convo = get_object_or_404(Conversation, pk=pk)
        if convo.status == "closed":
            return Response(ConversationSerializer(convo).data, status=status.HTTP_200_OK)

        convo.status = "closed"
        convo.save(update_fields=["status", "updated_at"])

        ChatMessage.objects.create(
            conversation=convo,
            sender=request.user,
            text="Chat was closed by admin.",
            is_system=True,
        )
        return Response(ConversationSerializer(convo).data, status=status.HTTP_200_OK)

class AdminConversationStatusUpdateView(APIView):
    """Admin can set conversation status (active/read_only/closed)."""

    permission_classes = [IsAdminOrStaff]

    def patch(self, request, pk):
        convo = get_object_or_404(Conversation, pk=pk)
        next_status = (request.data.get("status") or "").strip().lower()
        if next_status not in ("active", "read_only", "closed"):
            return Response(
                {"detail": "Invalid status."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if convo.status == next_status:
            return Response(ConversationSerializer(convo).data, status=status.HTTP_200_OK)

        # Claim convo for this admin if not set.
        if convo.admin_id is None:
            convo.admin = request.user

        convo.status = next_status
        convo.save(update_fields=["admin", "status", "updated_at"])

        # System message so both sides can see status changes in the timeline.
        label = "Active" if next_status == "active" else ("Waiting" if next_status == "read_only" else "Close")
        ChatMessage.objects.create(
            conversation=convo,
            sender=request.user,
            text=f"Chat marked as {label}.",
            is_system=True,
        )
        return Response(ConversationSerializer(convo).data, status=status.HTTP_200_OK)


class AdminConversationDeleteView(APIView):
    """Admin deletes an entire conversation."""

    permission_classes = [IsAdminOrStaff]

    def delete(self, request, pk):
        convo = get_object_or_404(Conversation, pk=pk)
        convo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminConversationClearMessagesView(APIView):
    """Admin clears all messages in a conversation (keeps conversation)."""

    permission_classes = [IsAdminOrStaff]

    def delete(self, request, pk):
        convo = get_object_or_404(Conversation, pk=pk)
        # Delete all messages in the conversation
        deleted_count = ChatMessage.objects.filter(conversation=convo).delete()[0]
        return Response(
            {
                "message": f"Deleted {deleted_count} messages from conversation",
                "conversation_id": pk,
                "deleted_count": deleted_count
            },
            status=status.HTTP_200_OK
        )


class UserConversationDeleteView(APIView):
    """User deletes their own conversation."""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        convo = get_object_or_404(Conversation, pk=pk, user=request.user)
        convo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserChatMessageDeleteForMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, conversation_id, message_id):
        convo = get_object_or_404(Conversation, pk=conversation_id, user=request.user)
        msg = get_object_or_404(ChatMessage, pk=message_id, conversation=convo)
        uid = int(request.user.id)
        deleted_for = msg.deleted_for or []
        if uid not in deleted_for:
            deleted_for.append(uid)
            msg.deleted_for = deleted_for
            msg.save(update_fields=["deleted_for"])
        return Response(ChatMessageSerializer(msg, context={"request": request}).data)


class UserChatMessageDeleteForEveryoneView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, conversation_id, message_id):
        convo = get_object_or_404(Conversation, pk=conversation_id, user=request.user)
        msg = get_object_or_404(ChatMessage, pk=message_id, conversation=convo)
        if msg.is_system:
            return Response({"detail": "Cannot delete system message."}, status=status.HTTP_400_BAD_REQUEST)
        if msg.sender_id != request.user.id:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        msg.is_deleted = True
        msg.save(update_fields=["is_deleted"])
        return Response(ChatMessageSerializer(msg, context={"request": request}).data)


class AdminChatMessageDeleteForMeView(APIView):
    permission_classes = [IsAdminOrStaff]

    def post(self, request, conversation_id, message_id):
        try:
            convo = get_object_or_404(Conversation, pk=conversation_id)
            msg = get_object_or_404(ChatMessage, pk=message_id, conversation=convo)
            uid = int(request.user.id)
            deleted_for = msg.deleted_for or []
            if uid not in deleted_for:
                deleted_for.append(uid)
                msg.deleted_for = deleted_for
                msg.save(update_fields=["deleted_for"])
            return Response(ChatMessageSerializer(msg, context={"request": request}).data)
        except Exception as e:
            print(f"Error in AdminChatMessageDeleteForMeView: {e}")
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminChatMessageDeleteForEveryoneView(APIView):
    permission_classes = [IsAdminOrStaff]

    def delete(self, request, conversation_id, message_id):
        try:
            convo = get_object_or_404(Conversation, pk=conversation_id)
            msg = get_object_or_404(ChatMessage, pk=message_id, conversation=convo)
            if msg.is_system:
                return Response({"detail": "Cannot delete system message."}, status=status.HTTP_400_BAD_REQUEST)
            msg.is_deleted = True
            msg.save(update_fields=["is_deleted"])
            return Response(ChatMessageSerializer(msg, context={"request": request}).data)
        except Exception as e:
            print(f"Error in AdminChatMessageDeleteForEveryoneView: {e}")
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ChatroomMessageDeleteForMeView(APIView):
    """Delete a chatroom message for the current user only"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, chatroom_id, message_id):
        # Check if user is a participant in the chatroom
        chatroom = get_object_or_404(Chatroom, pk=chatroom_id)
        is_participant = ChatroomParticipant.objects.filter(
            chatroom=chatroom,
            user=request.user,
            is_active=True
        ).exists()
        
        if not is_participant:
            return Response(
                {"detail": "You are not a participant in this chatroom."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        msg = get_object_or_404(ChatroomMessage, pk=message_id, chatroom=chatroom)
        uid = int(request.user.id)
        deleted_for = msg.deleted_for or []
        if uid not in deleted_for:
            deleted_for.append(uid)
            msg.deleted_for = deleted_for
            msg.save(update_fields=["deleted_for"])
        
        return Response(
            ChatroomMessageSerializer(msg, context={"request": request}).data
        )


class ChatroomMessageDeleteForEveryoneView(APIView):
    """Delete a chatroom message for everyone"""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, chatroom_id, message_id):
        # Check if user is a participant in the chatroom
        chatroom = get_object_or_404(Chatroom, pk=chatroom_id)
        is_participant = ChatroomParticipant.objects.filter(
            chatroom=chatroom,
            user=request.user,
            is_active=True
        ).exists()
        
        if not is_participant:
            return Response(
                {"detail": "You are not a participant in this chatroom."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        msg = get_object_or_404(ChatroomMessage, pk=message_id, chatroom=chatroom)
        
        if msg.is_system:
            return Response(
                {"detail": "Cannot delete system message."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Only the sender can delete for everyone
        if msg.sender_id != request.user.id:
            return Response(
                {"detail": "You can only delete your own messages for everyone."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        msg.is_deleted = True
        msg.save(update_fields=["is_deleted"])
        
        return Response(
            ChatroomMessageSerializer(msg, context={"request": request}).data
        )


class CreateMessageView(APIView):
    """Create a new message in adoption request chat"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, adoption_request_id):
        adoption_request = get_object_or_404(AdoptionRequest, id=adoption_request_id)

        # Check permissions - only requester or admin can send messages
        user = request.user
        if not (
            user == adoption_request.requester or user.is_staff or user.is_superuser
        ):
            return Response(
                {"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN
            )

        serializer = MessageCreateSerializer(data=request.data)
        if serializer.is_valid():
            message = serializer.save(adoption_request=adoption_request, sender=user)

            # TODO: Broadcast message via WebSocket (will implement with Django Channels)

            response_serializer = MessageSerializer(message)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserAdoptionRequestsView(generics.ListAPIView):
    """Get current user's adoption requests"""

    serializer_class = AdoptionRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            AdoptionRequest.objects.filter(requester=self.request.user)
            .select_related("pet")
            .order_by("-created_at")
        )


class MyActivityView(APIView):
    """Return current user's activity: lost reports, found reports, adoption requests"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        lost = LostPetReportSerializer(
            LostPetReport.objects.filter(reporter=user).order_by("-created_at"),
            many=True,
        ).data
        found = FoundPetReportSerializer(
            FoundPetReport.objects.filter(reporter=user).order_by("-created_at"),
            many=True,
        ).data
        adoptions = AdoptionRequestSerializer(
            AdoptionRequest.objects.filter(requester=user).select_related("pet", "pet__posted_by", "requester").order_by("-created_at"),
            many=True,
        ).data
        return Response(
            {"lost": lost, "found": found, "adoptions": adoptions},
            status=status.HTTP_200_OK,
        )


class AdminUserActivityView(APIView):
    """Admin view of a specific user's activity: lost, found, adoptions."""

    permission_classes = [IsAdminOrStaff]

    def get(self, request, user_id):
        user = get_object_or_404(User, pk=user_id)

        lost = LostPetReportSerializer(
            LostPetReport.objects.filter(reporter=user).order_by("-created_at"),
            many=True,
        ).data
        found = FoundPetReportSerializer(
            FoundPetReport.objects.filter(reporter=user).order_by("-created_at"),
            many=True,
        ).data
        adoptions = AdoptionRequestSerializer(
            AdoptionRequest.objects.filter(requester=user)
            .select_related("pet")
            .order_by("-created_at"),
            many=True,
        ).data

        return Response(
            {"lost": lost, "found": found, "adoptions": adoptions},
            status=status.HTTP_200_OK,
        )


class AdminClearDataView(APIView):
    """Dangerous: Admin-only endpoint to clear reports, pets, and related messages"""

    permission_classes = [IsAdminOrStaff]

    def post(self, request):
        # Delete in safe order due to FK constraints
        msg_count = Message.objects.all().count()
        Message.objects.all().delete()
        adopt_count = AdoptionRequest.objects.all().count()
        AdoptionRequest.objects.all().delete()
        found_count = FoundPetReport.objects.all().count()
        FoundPetReport.objects.all().delete()
        lost_count = LostPetReport.objects.all().count()
        LostPetReport.objects.all().delete()
        pet_count = Pet.objects.all().count()
        Pet.objects.all().delete()
        return Response(
            {
                "ok": True,
                "deleted": {
                    "messages": msg_count,
                    "adoption_requests": adopt_count,
                    "found_reports": found_count,
                    "lost_reports": lost_count,
                    "pets": pet_count,
                },
            },
            status=status.HTTP_200_OK,
        )


class AdminUserListView(APIView):
    """List all users for admin dashboard Users tab."""

    permission_classes = [IsAdminOrStaff]

    def get(self, request):
        # Import here to avoid circular imports between apps
        from Users.models import UserProfile

        # Only include profiles for active users so the table matches the
        # "real" active user count, but expose richer profile information
        profiles = (
            UserProfile.objects.select_related("user")
            .filter(user__is_active=True, user__is_staff=False, user__is_superuser=False)
            .order_by("-user__date_joined")
        )

        data = []
        for p in profiles:
            u = p.user
            data.append(
                {
                    "id": p.id,
                    "user_id": u.id,
                    "username": u.username,
                    "email": u.email,
                    "full_name": p.full_name,
                    "phone_number": p.phone_number,
                    "city": p.city,
                    "state": p.state,
                    "pincode": p.pincode,
                    "role": p.role,
                    "is_staff": u.is_staff,
                    "is_superuser": u.is_superuser,
                    "is_active": u.is_active,
                    "joined": u.date_joined.isoformat() if u.date_joined else None,
                }
            )

        return Response(data, status=status.HTTP_200_OK)


class AdminUserDeleteView(APIView):
    """Delete a user (admin only)."""
    
    permission_classes = [IsAdminOrStaff]
    
    def delete(self, request, user_id):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            user = User.objects.get(id=user_id)
            
            # Prevent deleting staff or superusers
            if user.is_staff or user.is_superuser:
                return Response(
                    {"error": "Cannot delete staff or admin users"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Prevent self-deletion
            if user.id == request.user.id:
                return Response(
                    {"error": "Cannot delete your own account"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            username = user.username
            user.delete()
            
            return Response(
                {"message": f"User '{username}' deleted successfully"},
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class NotificationListView(generics.ListAPIView):
    """List notifications for the current user"""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')


class NotificationMarkReadView(APIView):
    """Mark a notification as read"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, recipient=request.user)
            notification.is_read = True
            notification.save()
            return Response({'status': 'marked as read'}, status=status.HTTP_200_OK)
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)


class NotificationMarkAllReadView(APIView):
    """Mark all notifications as read for the current user"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'all notifications marked as read'}, status=status.HTTP_200_OK)


class AdminStaffListView(APIView):
    """List all staff/admin users for adding to chatrooms"""
    permission_classes = [IsAdminOrStaff]
    
    def get(self, request):
        from Users.models import UserProfile
        
        # Get all staff users (admins)
        staff_users = User.objects.filter(
            is_active=True,
            is_staff=True
        ).select_related('profile').order_by('username')
        
        data = []
        for user in staff_users:
            try:
                profile = user.profile
                user_unique_id = profile.user_unique_id
                full_name = profile.full_name
            except:
                user_unique_id = None
                full_name = user.username
            
            data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': full_name,
                'user_unique_id': user_unique_id,
                'is_superuser': user.is_superuser,
            })
        
        return Response(data, status=status.HTTP_200_OK)


# ============================================================================
# CHATROOM ACCESS APPROVAL VIEWS
# ============================================================================

class ChatroomInviteUserView(APIView):
    """Admin directly adds a user/admin to a chatroom (no pending approval needed)"""
    permission_classes = [IsAdminOrStaff]
    
    def post(self, request, chatroom_id=None):
        from .models import Chatroom, ChatroomParticipant, ChatroomMessage, Notification, Conversation, LostPetReport, FoundPetReport
        from .serializers import ChatroomSerializer, ChatroomParticipantSerializer
        from django.utils import timezone
        
        user_id = request.data.get('user_id')
        role = request.data.get('role', 'member')  # member, requested_user, founded_user, admin
        request_type = request.data.get('request_type', 'chatroom_join_request')
        conversation_id = request.data.get('conversation_id')
        pet_unique_id = request.data.get('pet_unique_id')
        pet_kind = request.data.get('pet_kind')
        
        if not user_id:
            return Response(
                {"error": "user_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            invited_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get admin name for notifications
        admin_name = request.user.username
        if hasattr(request.user, 'profile') and request.user.profile:
            admin_name = request.user.profile.full_name or request.user.username
        
        # Handle chatroom creation request (no chatroom exists yet - create it now)
        if request_type == 'chatroom_creation_request' or not chatroom_id:
            # Get conversation if provided
            conversation = None
            if conversation_id:
                try:
                    conversation = Conversation.objects.get(id=conversation_id)
                except Conversation.DoesNotExist:
                    pass
            
            # Get pet details for chatroom name
            pet_name = "Pet"
            pet_type = ""
            pet = None
            if pet_unique_id and pet_kind:
                if pet_kind == 'lost':
                    try:
                        pet = LostPetReport.objects.get(pet_unique_id=pet_unique_id)
                        pet_name = pet.pet_name or pet.pet_type
                        pet_type = pet.pet_type
                    except LostPetReport.DoesNotExist:
                        pass
                elif pet_kind == 'found':
                    try:
                        pet = FoundPetReport.objects.get(pet_unique_id=pet_unique_id)
                        pet_name = pet.pet_name or pet.pet_type
                        pet_type = pet.pet_type
                    except FoundPetReport.DoesNotExist:
                        pass
            
            # Check if chatroom already exists for this pet
            existing_chatroom = None
            if pet_unique_id:
                existing_chatroom = Chatroom.objects.filter(
                    pet_unique_id=pet_unique_id,
                    is_active=True
                ).first()
            
            if existing_chatroom:
                chatroom = existing_chatroom
            else:
                # Create chatroom name
                chatroom_name = f"{pet_name} - {pet_kind.capitalize() if pet_kind else 'Case'}"
                
                # Create the chatroom immediately
                chatroom = Chatroom.objects.create(
                    name=chatroom_name,
                    conversation=conversation,
                    pet_unique_id=pet_unique_id,
                    pet_kind=pet_kind,
                    purpose=f"{pet_kind.capitalize() if pet_kind else ''} Pet Case",
                    created_by=request.user,
                    is_active=True
                )
                
                # Add admin (creator) as participant
                ChatroomParticipant.objects.get_or_create(
                    chatroom=chatroom,
                    user=request.user,
                    defaults={'role': 'admin', 'is_active': True}
                )
                
                # Create system message for room creation
                ChatroomMessage.objects.create(
                    chatroom=chatroom,
                    sender=request.user,
                    text=f"Chatroom created by {admin_name}.",
                    is_system=True
                )
            
            # Check if user is already a participant
            existing_participant = ChatroomParticipant.objects.filter(
                chatroom=chatroom,
                user=invited_user
            ).first()
            
            if existing_participant:
                if existing_participant.is_active:
                    return Response(
                        {"error": "User is already a member of this chatroom"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                else:
                    # Reactivate the participant
                    existing_participant.is_active = True
                    existing_participant.role = role
                    existing_participant.save()
                    participant = existing_participant
            else:
                # Add user as active participant directly
                participant = ChatroomParticipant.objects.create(
                    chatroom=chatroom,
                    user=invited_user,
                    role=role,
                    is_active=True
                )
            
            # Get invited user's name
            invited_user_name = invited_user.username
            if hasattr(invited_user, 'profile') and invited_user.profile:
                invited_user_name = invited_user.profile.full_name or invited_user.username
            
            # Create system message for user being added
            ChatroomMessage.objects.create(
                chatroom=chatroom,
                sender=request.user,
                text=f"{invited_user_name} was added to the chatroom by {admin_name}.",
                is_system=True
            )
            
            # Create notification for the invited user (informing them they've been added)
            Notification.objects.create(
                recipient=invited_user,
                notification_type='chat_room_created',
                title='Added to Chatroom',
                message=f'You have been added to the chatroom "{chatroom.name}" by {admin_name}.',
                from_user=request.user
            )
            
            # Return chatroom data
            serializer = ChatroomSerializer(chatroom, context={'request': request})
            return Response({
                "chatroom": serializer.data,
                "participant": ChatroomParticipantSerializer(participant, context={'request': request}).data,
                "message": f"{invited_user_name} has been added to the chatroom"
            }, status=status.HTTP_201_CREATED)
        
        # Handle existing chatroom - add user directly
        try:
            chatroom = Chatroom.objects.get(id=chatroom_id)
        except Chatroom.DoesNotExist:
            return Response(
                {"error": "Chatroom not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is already a participant
        existing_participant = ChatroomParticipant.objects.filter(
            chatroom=chatroom,
            user=invited_user
        ).first()
        
        if existing_participant:
            if existing_participant.is_active:
                return Response(
                    {"error": "User is already a member of this chatroom"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                # Reactivate the participant
                existing_participant.is_active = True
                existing_participant.role = role
                existing_participant.save()
                participant = existing_participant
        else:
            # Add user as active participant directly
            participant = ChatroomParticipant.objects.create(
                chatroom=chatroom,
                user=invited_user,
                role=role,
                is_active=True
            )
        
        # Get invited user's name
        invited_user_name = invited_user.username
        if hasattr(invited_user, 'profile') and invited_user.profile:
            invited_user_name = invited_user.profile.full_name or invited_user.username
        
        # Create system message for user being added
        ChatroomMessage.objects.create(
            chatroom=chatroom,
            sender=request.user,
            text=f"{invited_user_name} was added to the chatroom by {admin_name}.",
            is_system=True
        )
        
        # Create notification for the invited user
        Notification.objects.create(
            recipient=invited_user,
            notification_type='chat_room_created',
            title='Added to Chatroom',
            message=f'You have been added to the chatroom "{chatroom.name}" by {admin_name}.',
            from_user=request.user
        )
        
        serializer = ChatroomSerializer(chatroom, context={'request': request})
        return Response({
            "chatroom": serializer.data,
            "participant": ChatroomParticipantSerializer(participant, context={'request': request}).data,
            "message": f"{invited_user_name} has been added to the chatroom"
        }, status=status.HTTP_201_CREATED)


class ChatroomAccessRequestListView(generics.ListAPIView):
    """List chatroom access requests for the current user (all statuses for activity history)
    
    Supports filtering by conversation_id for admin to check invitation status
    """
    serializer_class = ChatroomAccessRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        from .models import ChatroomAccessRequest
        
        # Check if filtering by conversation_id (for admin)
        conversation_id = self.request.query_params.get('conversation_id')
        
        if conversation_id and (self.request.user.is_staff or self.request.user.is_superuser):
            # Admin can fetch invitations by conversation
            return ChatroomAccessRequest.objects.filter(
                conversation_id=conversation_id
            ).select_related('chatroom', 'requested_user', 'added_by', 'pet').order_by('-created_at')
        
        # Return all requests for current user (pending, accepted, rejected) for activity history
        return ChatroomAccessRequest.objects.filter(
            requested_user=self.request.user
        ).select_related('chatroom', 'requested_user', 'added_by', 'pet').order_by('-created_at')


class ChatroomAccessRequestAcceptView(APIView):
    """User accepts a chatroom access request"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, request_id):
        from .models import (
            ChatroomAccessRequest, 
            ChatroomParticipant, 
            ChatroomMessage, 
            Notification,
            Chatroom,
            LostPetReport,
            FoundPetReport
        )
        from .serializers import ChatroomAccessRequestSerializer
        from django.utils import timezone
        
        try:
            access_request = ChatroomAccessRequest.objects.get(
                id=request_id,
                requested_user=request.user,
                status='pending'
            )
        except ChatroomAccessRequest.DoesNotExist:
            return Response(
                {"error": "Access request not found or already processed"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Handle chatroom creation request
        if access_request.request_type == 'chatroom_creation_request':
            # Get pet details for chatroom name
            pet_name = "Pet"
            pet_type = ""
            if access_request.pet_unique_id and access_request.pet_kind:
                if access_request.pet_kind == 'lost':
                    try:
                        pet = LostPetReport.objects.get(pet_unique_id=access_request.pet_unique_id)
                        pet_name = pet.pet_name or pet.pet_type
                        pet_type = pet.pet_type
                    except LostPetReport.DoesNotExist:
                        pass
                elif access_request.pet_kind == 'found':
                    try:
                        pet = FoundPetReport.objects.get(pet_unique_id=access_request.pet_unique_id)
                        pet_name = pet.pet_type
                        pet_type = pet.pet_type
                    except FoundPetReport.DoesNotExist:
                        pass
            
            # Create chatroom name
            chatroom_name = f"{pet_name} - {access_request.pet_kind.capitalize()} Case"
            
            # Create the chatroom
            chatroom = Chatroom.objects.create(
                name=chatroom_name,
                conversation=access_request.conversation,
                pet_unique_id=access_request.pet_unique_id,
                pet_kind=access_request.pet_kind,
                purpose=f"{access_request.pet_kind.capitalize()} Pet Case",
                created_by=access_request.added_by,
                is_active=True
            )
            
            # Update access request with the new chatroom
            access_request.chatroom = chatroom
            access_request.status = 'accepted'
            access_request.responded_at = timezone.now()
            access_request.save()
            
            # Add user as participant
            ChatroomParticipant.objects.create(
                chatroom=chatroom,
                user=request.user,
                role=access_request.role,
                is_active=True
            )
            
            # Add admin as participant
            ChatroomParticipant.objects.create(
                chatroom=chatroom,
                user=access_request.added_by,
                role='admin',
                is_active=True
            )
            
            # Create system message in chatroom
            ChatroomMessage.objects.create(
                chatroom=chatroom,
                sender=request.user,
                text=f"{request.user.username} accepted the chatroom invitation.",
                is_system=True
            )
            
            # Notify admin
            Notification.objects.create(
                recipient=access_request.added_by,
                notification_type='chatroom_request_accepted',
                title='Chatroom Request Accepted',
                message=f'{request.user.username} accepted your chatroom invitation.',
                from_user=request.user,
                chatroom_access_request=access_request
            )
            
            serializer = ChatroomAccessRequestSerializer(access_request, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        # Handle existing chatroom join request
        if not access_request.chatroom:
            return Response(
                {"error": "Chatroom not found for this request"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update request status
        access_request.status = 'accepted'
        access_request.responded_at = timezone.now()
        access_request.save()
        
        # Add user as participant
        ChatroomParticipant.objects.get_or_create(
            chatroom=access_request.chatroom,
            user=request.user,
            defaults={'role': access_request.role, 'is_active': True}
        )
        
        # Create system message in chatroom
        ChatroomMessage.objects.create(
            chatroom=access_request.chatroom,
            sender=request.user,
            text=f"{request.user.username} accepted the chat request.",
            is_system=True
        )
        
        # Notify admin
        Notification.objects.create(
            recipient=access_request.added_by,
            notification_type='chatroom_request_accepted',
            title='Chatroom Request Accepted',
            message=f'{request.user.username} accepted your chatroom invitation.',
            from_user=request.user,
            chatroom_access_request=access_request
        )
        
        serializer = ChatroomAccessRequestSerializer(access_request, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ChatroomAccessRequestRejectView(APIView):
    """User rejects a chatroom access request"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, request_id):
        from .models import ChatroomAccessRequest, Notification
        from .serializers import ChatroomAccessRequestSerializer
        from django.utils import timezone
        
        try:
            access_request = ChatroomAccessRequest.objects.get(
                id=request_id,
                requested_user=request.user,
                status='pending'
            )
        except ChatroomAccessRequest.DoesNotExist:
            return Response(
                {"error": "Access request not found or already processed"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update request status
        access_request.status = 'rejected'
        access_request.responded_at = timezone.now()
        access_request.save()
        
        # Notify admin
        Notification.objects.create(
            recipient=access_request.added_by,
            notification_type='chatroom_request_rejected',
            title='Chatroom Request Rejected',
            message=f'{request.user.username} rejected your chatroom invitation.',
            from_user=request.user,
            chatroom_access_request=access_request
        )
        
        serializer = ChatroomAccessRequestSerializer(access_request, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class MyChatroomsView(generics.ListAPIView):
    """List chatrooms the user has access to (accepted requests only)"""
    serializer_class = ChatroomSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        from .models import Chatroom, ChatroomParticipant
        # Get chatrooms where user is an active participant
        participant_chatroom_ids = ChatroomParticipant.objects.filter(
            user=self.request.user,
            is_active=True
        ).values_list('chatroom_id', flat=True)
        
        return Chatroom.objects.filter(
            id__in=participant_chatroom_ids,
            is_active=True
        ).select_related('created_by', 'conversation')


class AdminChatroomsView(generics.ListAPIView):
    """List chatrooms where admin is a participant (for admin chat interface)"""
    serializer_class = ChatroomSerializer
    permission_classes = [IsAdminOrStaff]
    
    def get_queryset(self):
        from .models import Chatroom, ChatroomParticipant
        # Get chatrooms where current admin is an active participant
        chatroom_ids = ChatroomParticipant.objects.filter(
            user=self.request.user,
            is_active=True
        ).values_list('chatroom_id', flat=True)
        
        return Chatroom.objects.filter(
            id__in=chatroom_ids,
            is_active=True
        ).select_related('created_by', 'conversation').order_by('-updated_at')


class AdminCreateChatroomView(APIView):
    """Admin creates a chatroom for a conversation"""
    permission_classes = [IsAdminOrStaff]
    
    def post(self, request):
        from .models import Chatroom, ChatroomParticipant, Conversation, ChatroomMessage
        from .serializers import ChatroomSerializer
        
        conversation_id = request.data.get('conversation_id')
        name = request.data.get('name')
        
        if not conversation_id or not name:
            return Response(
                {"error": "conversation_id and name are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            conversation = Conversation.objects.get(id=conversation_id)
        except Conversation.DoesNotExist:
            return Response(
                {"error": "Conversation not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create chatroom
        chatroom = Chatroom.objects.create(
            name=name.strip(),
            conversation=conversation,
            pet_unique_id=conversation.pet_unique_id,
            pet_name=conversation.pet_name,
            pet_kind=conversation.pet_kind,
            purpose="Admin Created Chatroom",
            created_by=request.user,
            is_active=True
        )
        
        # Add admin as participant
        ChatroomParticipant.objects.create(
            chatroom=chatroom,
            user=request.user,
            role='admin',
            is_active=True
        )
        
        # Don't automatically add conversation user - admin will invite them explicitly
        
        # Create system message
        ChatroomMessage.objects.create(
            chatroom=chatroom,
            sender=request.user,
            text=f"Chatroom '{name}' created by {request.user.username}.",
            is_system=True
        )
        
        serializer = ChatroomSerializer(chatroom)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminChatroomParticipantsView(generics.ListAPIView):
    """Admin view of chatroom participants with their status"""
    serializer_class = ChatroomParticipantSerializer
    permission_classes = [IsAdminOrStaff]
    
    def get_queryset(self):
        from .models import ChatroomParticipant
        chatroom_id = self.kwargs.get('chatroom_id')
        return ChatroomParticipant.objects.filter(
            chatroom_id=chatroom_id
        ).select_related('user', 'chatroom')


class AdminChatroomAccessRequestsView(generics.ListAPIView):
    """Admin view of all access requests for a chatroom"""
    serializer_class = ChatroomAccessRequestSerializer
    permission_classes = [IsAdminOrStaff]
    
    def get_queryset(self):
        from .models import ChatroomAccessRequest
        chatroom_id = self.kwargs.get('chatroom_id')
        return ChatroomAccessRequest.objects.filter(
            chatroom_id=chatroom_id
        ).select_related('chatroom', 'requested_user', 'added_by', 'pet')



class ChatroomParticipantsView(generics.ListAPIView):
    """List participants in a chatroom"""
    serializer_class = ChatroomParticipantSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        from .models import ChatroomParticipant
        chatroom_id = self.kwargs.get('chatroom_id')
        
        # Verify user is a participant or admin
        is_participant = ChatroomParticipant.objects.filter(
            chatroom_id=chatroom_id,
            user=self.request.user,
            is_active=True
        ).exists()
        
        is_admin = self.request.user.is_staff
        
        if not (is_participant or is_admin):
            return ChatroomParticipant.objects.none()
        
        return ChatroomParticipant.objects.filter(
            chatroom_id=chatroom_id,
            is_active=True
        ).select_related('user', 'user__profile').order_by('role', 'joined_at')


class ClearChatroomMessagesView(APIView):
    """Clear all messages in a chatroom (admin only)"""
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]
    
    def delete(self, request, chatroom_id):
        from .models import Chatroom, ChatroomMessage
        
        try:
            chatroom = Chatroom.objects.get(id=chatroom_id)
            
            # Delete all messages in the chatroom (keep chatroom and participants)
            deleted_count = ChatroomMessage.objects.filter(chatroom=chatroom).delete()[0]
            
            return Response(
                {
                    "message": f"Deleted {deleted_count} messages from chatroom '{chatroom.name}'",
                    "chatroom_id": chatroom_id,
                    "deleted_count": deleted_count
                },
                status=status.HTTP_200_OK
            )
        except Chatroom.DoesNotExist:
            return Response(
                {"error": "Chatroom not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class DeleteChatroomView(APIView):
    """Delete entire chatroom including messages and participants"""
    permission_classes = [permissions.IsAuthenticated]
    
    def delete(self, request, chatroom_id):
        from .models import Chatroom
        
        try:
            chatroom = Chatroom.objects.get(id=chatroom_id)
            
            # Check if user is an admin OR a participant in the chatroom
            is_admin = request.user.is_staff or request.user.is_superuser
            is_participant = ChatroomParticipant.objects.filter(
                chatroom=chatroom,
                user=request.user,
                is_active=True
            ).exists()
            
            if not (is_admin or is_participant):
                return Response(
                    {"error": "You don't have permission to delete this chatroom"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            chatroom_name = chatroom.name
            
            # Delete the chatroom (cascade will delete messages and participants)
            chatroom.delete()
            
            return Response(
                {
                    "message": f"Chatroom '{chatroom_name}' deleted successfully",
                    "chatroom_id": chatroom_id
                },
                status=status.HTTP_200_OK
            )
        except Chatroom.DoesNotExist:
            return Response(
                {"error": "Chatroom not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class ChatroomMessageListCreateView(generics.ListCreateAPIView):
    """List and create messages in a chatroom"""
    serializer_class = ChatroomMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    
    def get_queryset(self):
        from .models import ChatroomMessage, ChatroomParticipant
        chatroom_id = self.kwargs.get('chatroom_id')
        
        # Verify user is a participant in this chatroom
        is_participant = ChatroomParticipant.objects.filter(
            chatroom_id=chatroom_id,
            user=self.request.user,
            is_active=True
        ).exists()
        
        if not is_participant:
            return ChatroomMessage.objects.none()
        
        return ChatroomMessage.objects.filter(
            chatroom_id=chatroom_id
        ).select_related('sender', 'reply_to__sender').order_by('created_at')
    
    def perform_create(self, serializer):
        from .models import Chatroom, ChatroomParticipant
        import mimetypes
        import os
        
        chatroom_id = self.kwargs.get('chatroom_id')
        
        # Verify chatroom exists
        try:
            chatroom = Chatroom.objects.get(id=chatroom_id)
        except Chatroom.DoesNotExist:
            raise permissions.PermissionDenied("Chatroom not found")
        
        # Verify user is a participant
        is_participant = ChatroomParticipant.objects.filter(
            chatroom=chatroom,
            user=self.request.user,
            is_active=True
        ).exists()
        
        if not is_participant:
            raise permissions.PermissionDenied("You are not a participant in this chatroom")
        
        # Get reply_to message if provided
        reply_to_id = self.request.data.get('reply_to_message_id')
        reply_to = None
        if reply_to_id:
            from .models import ChatroomMessage
            try:
                reply_to = ChatroomMessage.objects.get(id=reply_to_id, chatroom=chatroom)
            except ChatroomMessage.DoesNotExist:
                pass
        
        # Handle file attachment
        attachment_file = self.request.FILES.get('attachment')
        attachment_type = None
        attachment_name = None
        attachment_size = None
        
        if attachment_file:
            attachment_name = attachment_file.name
            attachment_size = attachment_file.size
            
            # Determine attachment type based on MIME type
            mime_type, _ = mimetypes.guess_type(attachment_name)
            if mime_type:
                if mime_type.startswith('image/'):
                    attachment_type = 'image'
                elif mime_type.startswith('video/'):
                    attachment_type = 'video'
                elif attachment_name.endswith(('.zip', '.tar', '.gz', '.rar')):
                    attachment_type = 'folder'
                else:
                    attachment_type = 'document'
            else:
                # Default to document if MIME type cannot be determined
                attachment_type = 'document'
        
        serializer.save(
            chatroom=chatroom,
            sender=self.request.user,
            reply_to=reply_to,
            attachment=attachment_file,
            attachment_type=attachment_type,
            attachment_name=attachment_name,
            attachment_size=attachment_size
        )
