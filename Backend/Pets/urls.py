from django.urls import path

from .views import (
    AdminClearDataView,
    AdminConversationAcceptView,
    AdminConversationCloseView,
    AdminConversationListView,
    AdminFoundPetDetailView,
    AdminFoundPetListView,
    AdminLostPetDetailView,
    AdminLostPetListView,
    AdminReportSummaryView,
    AdminUpdateAdoptionRequestView,
    AdminUserListView,
    AdminUserActivityView,
    AdminChatMessageListCreateView,
    AdoptionRequestDetailView,
    AdoptionRequestListView,
    AllReportsView,
    CreateAdoptionRequestView,
    CreateMessageView,
    FoundPetReportView,
    FoundPetReportDetailView,
    LostPetReportView,
    LostPetReportDetailView,
    MessageListView,
    MyActivityView,
    PetDetailView,
    PetListView,
    PublicFoundPetsView,
    PublicLostPetsView,
    UserAdoptionRequestsView,
    UserChatMessageListCreateView,
    UserConversationConfirmView,
    UserConversationListCreateView,
)

urlpatterns = [
    # User-facing report endpoints
    path("reports/found/", FoundPetReportView.as_view(), name="pets-found-report"),
    path(
        "reports/found/<int:pk>/",
        FoundPetReportDetailView.as_view(),
        name="pets-found-report-detail",
    ),
    path("reports/lost/", LostPetReportView.as_view(), name="pets-lost-report"),
    path(
        "reports/lost/<int:pk>/",
        LostPetReportDetailView.as_view(),
        name="pets-lost-report-detail",
    ),
    path("reports/all/", AllReportsView.as_view(), name="pets-all-reports"),
    # Public pet listings for dashboard
    path("public/lost/", PublicLostPetsView.as_view(), name="pets-public-lost"),
    path("public/found/", PublicFoundPetsView.as_view(), name="pets-public-found"),
    # Admin dashboard endpoints
    path("admin/summary/", AdminReportSummaryView.as_view(), name="admin-report-summary"),
    path("admin/users/", AdminUserListView.as_view(), name="admin-user-list"),
    path(
        "admin/users/<int:user_id>/activity/",
        AdminUserActivityView.as_view(),
        name="admin-user-activity",
    ),
    path(
        "admin/reports/found/",
        AdminFoundPetListView.as_view(),
        name="pets-admin-found-list",
    ),
    path(
        "admin/reports/found/<int:pk>/",
        AdminFoundPetDetailView.as_view(),
        name="pets-admin-found-detail",
    ),
    path(
        "admin/reports/lost/",
        AdminLostPetListView.as_view(),
        name="pets-admin-lost-list",
    ),
    path(
        "admin/reports/lost/<int:pk>/",
        AdminLostPetDetailView.as_view(),
        name="pets-admin-lost-detail",
    ),
    # Adoption feature endpoints
    path("pets/", PetListView.as_view(), name="pets-list"),
    path("pets/<int:pk>/", PetDetailView.as_view(), name="pets-detail"),
    path(
        "pets/<int:pet_id>/adoption-requests/",
        CreateAdoptionRequestView.as_view(),
        name="create-adoption-request",
    ),
    path(
        "adoption-requests/",
        AdoptionRequestListView.as_view(),
        name="adoption-requests-list",
    ),
    path(
        "adoption-requests/<int:pk>/",
        AdoptionRequestDetailView.as_view(),
        name="adoption-request-detail",
    ),
    path(
        "my-adoption-requests/",
        UserAdoptionRequestsView.as_view(),
        name="user-adoption-requests",
    ),
    path(
        "my-activity/",
        MyActivityView.as_view(),
        name="user-my-activity",
    ),
    path(
        "adoption-requests/<int:adoption_request_id>/messages/",
        MessageListView.as_view(),
        name="adoption-messages-list",
    ),
    path(
        "adoption-requests/<int:adoption_request_id>/messages/create/",
        CreateMessageView.as_view(),
        name="create-adoption-message",
    ),
    # Admin adoption endpoints
    path(
        "admin/adoption-requests/<int:pk>/",
        AdminUpdateAdoptionRequestView.as_view(),
        name="admin-update-adoption-request",
    ),
    path(
        "admin/clear-data/",
        AdminClearDataView.as_view(),
        name="admin-clear-data",
    ),
    # General chat endpoints
    path(
        "chat/conversations/",
        UserConversationListCreateView.as_view(),
        name="chat-conversations",
    ),
    path(
        "chat/conversations/<int:pk>/confirm/",
        UserConversationConfirmView.as_view(),
        name="chat-conversation-confirm",
    ),
    path(
        "chat/conversations/<int:conversation_id>/messages/",
        UserChatMessageListCreateView.as_view(),
        name="chat-messages-user",
    ),
    path(
        "admin/chat/conversations/",
        AdminConversationListView.as_view(),
        name="chat-conversations-admin",
    ),
    path(
        "admin/chat/conversations/<int:conversation_id>/messages/",
        AdminChatMessageListCreateView.as_view(),
        name="chat-messages-admin",
    ),
    path(
        "admin/chat/conversations/<int:pk>/accept/",
        AdminConversationAcceptView.as_view(),
        name="chat-conversation-accept",
    ),
    path(
        "admin/chat/conversations/<int:pk>/close/",
        AdminConversationCloseView.as_view(),
        name="chat-conversation-close",
    ),
]
