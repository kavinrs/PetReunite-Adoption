import logging

try:
    import torch
except Exception:  # pragma: no cover - optional dependency
    torch = None

from . import download_if_missing

logger = logging.getLogger(__name__)


class YOLOLoader:
    def __init__(self):
        self.model = None
        self.model_path = None

    def load_model(self):
        if self.model is not None:
            return self.model

        model_path = download_if_missing("best.pt")
        self.model_path = model_path
        if torch is None:
            raise ImportError("torch is required to load the YOLO model")
        self.model = torch.hub.load("ultralytics/yolov5", "custom", path=str(model_path), source="local")
        return self.model

    def predict(self, image_file):
        model = self.load_model()
        return {"detected_class": None, "confidence": 0.0}

    def compare_pet_types(self, detected_type: str, user_pet_type: str) -> bool:
        return str(detected_type).lower() == str(user_pet_type).lower()

    def normalize_pet_type(self, value: str) -> str:
        return str(value).strip().lower()


yolo_loader = YOLOLoader()
