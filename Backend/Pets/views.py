from django.utils import timezone
from rest_framework import generics, parsers, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import STATUS_CHOICES, FoundPetReport, LostPetReport
from .serializers import (
    AdminFoundPetReportSerializer,
    AdminLostPetReportSerializer,
    FoundPetReportSerializer,
    LostPetReportSerializer,
)


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

    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        lost_qs = LostPetReport.objects.all()
        found_qs = FoundPetReport.objects.all()

        def status_counts(qs):
            return {code: qs.filter(status=code).count() for code, _ in STATUS_CHOICES}

        data = {
            "lost_total": lost_qs.count(),
            "found_total": found_qs.count(),
            "lost_this_month": lost_qs.filter(created_at__gte=month_start).count(),
            "found_this_month": found_qs.filter(created_at__gte=month_start).count(),
            "status_breakdown": {
                "lost": status_counts(lost_qs),
                "found": status_counts(found_qs),
            },
        }

        return Response(data, status=status.HTTP_200_OK)


class AdminFoundPetListView(generics.ListAPIView):
    serializer_class = AdminFoundPetReportSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = FoundPetReport.objects.select_related("reporter").all()
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        return qs


class AdminFoundPetDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = AdminFoundPetReportSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = FoundPetReport.objects.select_related("reporter").all()


class AdminLostPetListView(generics.ListAPIView):
    serializer_class = AdminLostPetReportSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = LostPetReport.objects.select_related("reporter").all()
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        return qs


class AdminLostPetDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = AdminLostPetReportSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = LostPetReport.objects.select_related("reporter").all()
