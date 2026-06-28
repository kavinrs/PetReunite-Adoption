from django.apps import AppConfig


class PetsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'Pets'
    
    def ready(self):
        """Import signal handlers and load ML models when the app is ready"""
        import Pets.signals
        
                                                  
        try:
            from ml_models.model_loader import deepfake_detector
            import logging
            logger = logging.getLogger(__name__)
            logger.info("Loading deepfake detection model...")
            deepfake_detector.load_model()
            logger.info("Deepfake detection model loaded successfully")
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Could not load deepfake detection model: {e}")
            logger.warning("Image verification will not be available")
