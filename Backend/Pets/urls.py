from django.urls import path

from .views import (
    FoundPetReportView,
    LostPetReportView,
    AllReportsView,
    AdminReportSummaryView,
    AdminFoundPetListView,
    AdminFoundPetDetailView,
    AdminLostPetListView,
    AdminLostPetDetailView,
)

urlpatterns = [
    # User-facing report endpoints
    path("reports/found/", FoundPetReportView.as_view(), name="pets-found-report"),
    path("reports/lost/", LostPetReportView.as_view(), name="pets-lost-report"),
    path("reports/all/", AllReportsView.as_view(), name="pets-all-reports"),

    # Admin dashboard endpoints
    path("admin/summary/", AdminReportSummaryView.as_view(), name="pets-admin-summary"),
    path("admin/reports/found/", AdminFoundPetListView.as_view(), name="pets-admin-found-list"),
    path("admin/reports/found/<int:pk>/", AdminFoundPetDetailView.as_view(), name="pets-admin-found-detail"),
    path("admin/reports/lost/", AdminLostPetListView.as_view(), name="pets-admin-lost-list"),
    path("admin/reports/lost/<int:pk>/", AdminLostPetDetailView.as_view(), name="pets-admin-lost-detail"),
]

