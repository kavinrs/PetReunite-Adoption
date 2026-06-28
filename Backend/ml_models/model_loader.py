import logging

try:
    from tensorflow.keras.models import load_model
except Exception:  # pragma: no cover - optional dependency
    load_model = None

from . import download_if_missing

logger = logging.getLogger(__name__)


class DeepfakeDetector:
    def __init__(self):
        self.model = None
        self.model_path = None

    def load_model(self):
        if self.model is not None:
            return self.model

        model_filename = "final_fake_detector_model.h5"
        self.model_path = download_if_missing(model_filename)
        logger.info("Loading deepfake detector from %s", self.model_path)
        if load_model is None:
            raise ImportError("tensorflow is required to load the deepfake detector model")
        self.model = load_model(str(self.model_path))
        return self.model


deepfake_detector = DeepfakeDetector()
