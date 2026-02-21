"""
Utility functions for ML-based image processing.
Handles image preprocessing for deepfake detection.
"""
import io
import logging
from typing import Tuple, Dict
from PIL import Image
import numpy as np

logger = logging.getLogger(__name__)


def preprocess_image_for_efficientnet(image_file) -> np.ndarray:
    """
    Preprocess image for EfficientNet model.
    Follows exact training preprocessing pipeline.
    
    Args:
        image_file: Django UploadedFile or file-like object
        
    Returns:
        Preprocessed numpy array ready for model inference
    """
    try:
        import tensorflow as tf
        
        # Read image
        if hasattr(image_file, 'read'):
            image_bytes = image_file.read()
            # Reset file pointer for potential reuse
            if hasattr(image_file, 'seek'):
                image_file.seek(0)
        else:
            image_bytes = image_file
        
        # Open with PIL and convert to RGB
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Resize to 224x224 (EfficientNet input size)
        img = img.resize((224, 224))
        
        # Convert to numpy array
        img_array = np.array(img)
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        # Apply EfficientNet preprocessing
        img_array = tf.keras.applications.efficientnet.preprocess_input(img_array)
        
        return img_array
        
    except Exception as e:
        logger.error(f"Error preprocessing image: {e}")
        raise


def predict_image_authenticity(image_file) -> Dict[str, any]:
    """
    Predict if an image is real or AI-generated (fake).
    
    Uses the trained EfficientNet model with exact inference logic:
    - Classes are alphabetical: ['fake', 'real']
    - Model output represents probability of "real"
    - Threshold: 0.7
    
    Args:
        image_file: Django UploadedFile or file-like object
        
    Returns:
        Dictionary with:
        - label: "Real", "Fake", or "Uncertain"
        - confidence: float (0-1)
        - raw_score: float (model output)
        - status: "verified", "fake_detected", "uncertain"
    """
    try:
        from ml_models.model_loader import deepfake_detector
        
        # Load model (singleton, only loads once)
        model = deepfake_detector.model
        
        # Preprocess image
        img_array = preprocess_image_for_efficientnet(image_file)
        
        # Run prediction
        prediction = model.predict(img_array, verbose=0)[0][0]
        raw_score = float(prediction)
        
        # Apply threshold logic (exact as training)
        # prediction > 0.7 → Real
        # prediction < 0.3 → Fake (inverse of 0.7 for symmetry)
        # else → Uncertain
        if raw_score > 0.7:
            label = "Real"
            status = "verified"
            confidence = raw_score
        elif raw_score < 0.3:
            label = "Fake"
            status = "fake_detected"
            confidence = 1 - raw_score  # Confidence in being fake
        else:
            label = "Uncertain"
            status = "uncertain"
            confidence = 0.5  # Neutral confidence
        
        logger.info(f"Image authenticity check: {label} (score: {raw_score:.4f})")
        
        return {
            "label": label,
            "confidence": round(confidence, 4),
            "raw_score": round(raw_score, 4),
            "status": status
        }
        
    except Exception as e:
        logger.error(f"Error during image authenticity prediction: {e}")
        raise


def validate_image_file(image_file, max_size_mb: int = 10) -> Tuple[bool, str]:
    """
    Validate uploaded image file.
    
    Args:
        image_file: Django UploadedFile
        max_size_mb: Maximum file size in MB
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check file size
    max_size_bytes = max_size_mb * 1024 * 1024
    if image_file.size > max_size_bytes:
        return False, f"File size exceeds {max_size_mb}MB limit"
    
    # Check file type
    allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    content_type = getattr(image_file, 'content_type', '')
    
    if content_type and content_type not in allowed_types:
        return False, f"Invalid file type. Allowed: JPEG, PNG, WEBP"
    
    # Try to open with PIL to verify it's a valid image
    try:
        img = Image.open(image_file)
        img.verify()
        # Reset file pointer after verify
        image_file.seek(0)
        return True, ""
    except Exception as e:
        return False, f"Invalid or corrupted image file: {str(e)}"
