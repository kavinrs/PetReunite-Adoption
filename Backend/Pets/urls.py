from django.urls import path

from .views import FoundPetReportView, LostPetReportView, AllReportsView

urlpatterns = [
    path("reports/found/", FoundPetReportView.as_view(), name="pets-found-report"),
    path("reports/lost/", LostPetReportView.as_view(), name="pets-lost-report"),
    path("reports/all/", AllReportsView.as_view(), name="pets-all-reports"),
]

