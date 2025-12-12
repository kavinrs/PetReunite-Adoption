from django.urls import path

from . import views


urlpatterns = [
    # Auth
    path("auth/register", views.RegisterView.as_view(), name="auth-register"),
    path("auth/login", views.LoginView.as_view(), name="auth-login"),

    # User lookup
    path("users/by-email", views.UserByEmailView.as_view(), name="user-by-email"),

    # Rooms
    path("rooms/", views.RoomListCreateView.as_view(), name="room-list-create"),
    path("rooms/<uuid:room_id>/", views.RoomDetailView.as_view(), name="room-detail"),
    path(
        "rooms/<uuid:room_id>/members/",
        views.RoomMemberAddView.as_view(),
        name="room-member-add",
    ),
    path(
        "rooms/<uuid:room_id>/members/<uuid:user_id>/",
        views.RoomMemberRemoveView.as_view(),
        name="room-member-remove",
    ),

    # Messages
    path(
        "messages/room/<uuid:room_id>/",
        views.RoomMessageListCreateView.as_view(),
        name="room-messages",
    ),
    path(
        "messages/<uuid:message_id>/",
        views.MessageDeleteView.as_view(),
        name="message-delete",
    ),
]