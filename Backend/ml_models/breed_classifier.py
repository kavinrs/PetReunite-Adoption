import logging

try:
    import torch
except Exception:  # pragma: no cover - optional dependency
    torch = None

from . import download_if_missing

logger = logging.getLogger(__name__)


class BreedClassifier:
    def __init__(self):
        self.model = None
        self.model_path = None
        self.supported_pet_types = {"dog", "cat", "rabbit", "horse"}

    def _load_model_for(self, pet_type: str):
        if pet_type not in self.supported_pet_types:
            return None

        model_filename = {
            "dog": "dog_breed_model.pth",
            "cat": "cat_breed_model.pth",
            "rabbit": "rabbit_breed_model.pth",
            "horse": "horse_breed_model.pth",
        }[pet_type]

        model_path = download_if_missing(model_filename)
        if self.model is None or self.model_path != model_path:
            self.model_path = model_path
            if torch is None:
                raise ImportError("torch is required to load breed classification models")
            self.model = torch.load(str(model_path), map_location="cpu")
        return self.model

    def is_supported(self, pet_type: str) -> bool:
        return pet_type.lower() in self.supported_pet_types

    def predict(self, image_file, pet_type: str):
        model = self._load_model_for(pet_type)
        if model is None:
            raise ValueError(f"Unsupported pet type: {pet_type}")
        return {"predicted_breed": "unknown", "confidence": 0.0}

    def compare_breeds(self, predicted_breed: str, user_breed: str) -> bool:
        return str(predicted_breed).lower() == str(user_breed).lower()

    def normalize_breed_name(self, value: str) -> str:
        return str(value).strip().lower()


breed_classifier = BreedClassifier()
