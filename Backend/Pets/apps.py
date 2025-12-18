from django.apps import AppConfig


class PetsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'Pets'
    
    def ready(self):
        """Import signal handlers when the app is ready"""
        import Pets.signals
