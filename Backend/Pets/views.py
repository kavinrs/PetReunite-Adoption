from rest_framework import generics, permissions, parsers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import FoundPetReport, LostPetReport
from .serializers import FoundPetReportSerializer, LostPetReportSerializer


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
        found = FoundPetReportSerializer(
            FoundPetReport.objects.filter(reporter=request.user), many=True
        ).data
        lost = LostPetReportSerializer(
            LostPetReport.objects.filter(reporter=request.user), many=True
        ).data
        return Response({"lost": lost, "found": found}, status=status.HTTP_200_OK)
from django.shortcuts import render

# Create your views here.
