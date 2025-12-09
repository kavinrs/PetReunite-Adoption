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
    Conversation,
    FoundPetReport,
    LostPetReport,
    Message,
    Pet,
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
            instance.has_user_update = True

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
                    "pet_type": instance.pet_type,
                    "breed": instance.breed,
                    "color": instance.color,
                    "estimated_age": instance.estimated_age,
                    "found_city": instance.found_city,
                    "state": instance.state,
                    "description": instance.description,
                }
            instance.has_user_update = True

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
        found = FoundPetReportSerializer(
            FoundPetReport.objects.filter(
                status__in=["approved", "investigating", "matched"]
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
    """Public view of all lost pets for dashboard display"""

    serializer_class = LostPetReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LostPetReport.objects.filter(
            status__in=["approved", "investigating", "matched"]
        ).order_by("-created_at")[:20]  # Show latest 20


class PublicFoundPetsView(generics.ListAPIView):
    """Public view of all found pets for dashboard display"""

    serializer_class = FoundPetReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FoundPetReport.objects.filter(
            status__in=["approved", "investigating", "matched"]
        ).order_by("-created_at")[:20]  # Show latest 20


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
        total_users = User.objects.filter(is_active=True).count()
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


class AdminFoundPetDetailView(generics.RetrieveUpdateAPIView):
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


class AdminLostPetDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = AdminLostPetReportSerializer
    permission_classes = [IsAdminOrStaff]
    queryset = LostPetReport.objects.select_related("reporter").all()


# Adoption Feature Views
class PetDetailView(generics.RetrieveAPIView):
    """Get full pet details for adoption"""

    serializer_class = PetSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Pet.objects.filter(is_active=True).select_related("posted_by")


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
            return AdoptionRequest.objects.select_related("pet", "requester").all()
        return AdoptionRequest.objects.filter(requester=user).select_related("pet")


class AdoptionRequestDetailView(generics.RetrieveAPIView):
    """Get adoption request details"""

    serializer_class = AdoptionRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return AdoptionRequest.objects.select_related("pet", "requester").all()
        return AdoptionRequest.objects.filter(requester=user).select_related("pet")


class AdminUpdateAdoptionRequestView(generics.UpdateAPIView):
    """Admin update adoption request status"""

    serializer_class = AdminAdoptionRequestSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = AdoptionRequest.objects.all()

    def perform_update(self, serializer):
        adoption_request = self.get_object()
        old_status = adoption_request.status

        instance = serializer.save()

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

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ChatMessageCreateSerializer
        return ChatMessageSerializer

    def get_queryset(self):
        convo_id = self.kwargs["conversation_id"]
        convo = get_object_or_404(Conversation, pk=convo_id, user=self.request.user)
        return convo.messages.select_related("sender")

    def perform_create(self, serializer):
        convo_id = self.kwargs["conversation_id"]
        convo = get_object_or_404(Conversation, pk=convo_id, user=self.request.user)
        if convo.status != "active":
            raise permissions.PermissionDenied("Conversation is not active.")
        serializer.save(conversation=convo, sender=self.request.user)


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


class AdminChatMessageListCreateView(generics.ListCreateAPIView):
    """List/send messages in a conversation for admins."""

    permission_classes = [IsAdminOrStaff]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ChatMessageCreateSerializer
        return ChatMessageSerializer

    def get_queryset(self):
        convo_id = self.kwargs["conversation_id"]
        convo = get_object_or_404(Conversation, pk=convo_id)
        return convo.messages.select_related("sender")

    def perform_create(self, serializer):
        convo_id = self.kwargs["conversation_id"]
        convo = get_object_or_404(Conversation, pk=convo_id)
        if convo.status != "active":
            raise permissions.PermissionDenied("Conversation is not active.")
        serializer.save(conversation=convo, sender=self.request.user)

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
            AdoptionRequest.objects.filter(requester=user).select_related("pet").order_by("-created_at"),
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
        # Only include active users so the table matches the real active user count
        users = (
            User.objects.filter(is_active=True)
            .order_by("-date_joined")
            .values("id", "username", "email", "is_staff", "is_active", "date_joined")
        )
        data = [
            {
                "id": u["id"],
                "username": u["username"],
                "email": u["email"],
                "is_staff": u["is_staff"],
                "is_active": u["is_active"],
                "joined": u["date_joined"].isoformat() if u["date_joined"] else None,
            }
            for u in users
        ]
        return Response(data, status=status.HTTP_200_OK)
