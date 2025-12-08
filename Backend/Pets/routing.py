from django.urls import path

from .consumers import AdoptionChatConsumer, NotificationConsumer

websocket_urlpatterns = [
    path(
        "ws/adoption/<int:adoption_request_id>/chat/",
        AdoptionChatConsumer.as_asgi(),
        name="adoption_chat",
    ),
    path(
        "ws/notifications/",
        NotificationConsumer.as_asgi(),
        name="notifications",
    ),
]
