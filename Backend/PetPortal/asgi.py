import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "PetPortal.settings")

# Django setup must happen before importing models
import django
django.setup()

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from Pets.routing import websocket_urlpatterns as pets_ws
from chat.routing import websocket_urlpatterns as chat_ws

application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": AuthMiddlewareStack(
            URLRouter(pets_ws + chat_ws)
        ),
    }
)