"""
API views for ML-based image verification.
"""
import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from .ml_utils import predict_image_authenticity, validate_image_file
from ml_models.yolo_loader import yolo_loader

logger = logging.getLogger(__name__)


class CheckImageAuthenticityView(APIView):
    """
    API endpoint to check if an uploaded image is real or AI-generated.
    
    POST /api/check-image-authenticity/
    
    Request:
        - image: multipart/form-data file
        
    Response:
        {
            "label": "Real" | "Fake" | "Uncertain",
            "confidence": 0.96,
            "raw_score": 0.9623,
            "status": "verified" | "fake_detected" | "uncertain"
        }
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """Handle image authenticity check request."""
        try:
            # Get uploaded image
            image_file = request.FILES.get('image')
            
            if not image_file:
                return Response(
                    {"error": "No image file provided. Please upload an image."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate image file
            is_valid, error_message = validate_image_file(image_file, max_size_mb=10)
            if not is_valid:
                return Response(
                    {"error": error_message},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Run prediction
            result = predict_image_authenticity(image_file)
            
            # Add warning message if fake detected
            if result['label'] == 'Fake':
                result['warning'] = (
                    "This image appears to be AI-generated. "
                    "Please upload a genuine pet photo."
                )
            elif result['label'] == 'Uncertain':
                result['warning'] = (
                    "Image authenticity is uncertain. "
                    "Please ensure you upload a clear, genuine photo."
                )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error in image authenticity check: {e}", exc_info=True)
            return Response(
                {
                    "error": "Failed to process image. Please try again.",
                    "detail": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



class VerifyPetTypeView(APIView):
    """
    API endpoint to verify pet type using YOLO detection.
    
    POST /api/pets/verify-pet-type/
    
    Request:
        - image: multipart/form-data file
        - pet_type: string (user entered pet type)
        
    Response:
        {
            "detected_type": "dog",
            "confidence": 0.95,
            "user_input": "dog",
            "is_match": true,
            "normalized_detected": "dog",
            "normalized_input": "dog",
            "message": "Pet type verified successfully"
        }
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """Handle pet type verification request."""
        try:
            # Get uploaded image
            image_file = request.FILES.get('image')
            user_pet_type = request.data.get('pet_type', '').strip()
            
            # Validate inputs
            if not image_file:
                return Response(
                    {"error": "No image file provided. Please upload an image."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not user_pet_type:
                return Response(
                    {"error": "Pet type is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate image file
            is_valid, error_message = validate_image_file(image_file, max_size_mb=10)
            if not is_valid:
                return Response(
                    {"error": error_message},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f"Verifying pet type: user_input='{user_pet_type}'")
            
            # Run YOLO prediction
            try:
                prediction = yolo_loader.predict(image_file)
            except Exception as e:
                logger.error(f"YOLO prediction failed: {e}", exc_info=True)
                return Response(
                    {
                        "error": "Failed to detect pet type in image.",
                        "detail": str(e),
                        "detected_type": None,
                        "confidence": 0.0,
                        "is_match": False
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            detected_type = prediction['detected_class']
            confidence = prediction['confidence']
            
            # Handle no detection
            if not detected_type:
                return Response(
                    {
                        "detected_type": None,
                        "confidence": 0.0,
                        "user_input": user_pet_type,
                        "is_match": False,
                        "message": "No pet detected in image. Please upload a clear photo of your pet.",
                        "status": "no_detection"
                    },
                    status=status.HTTP_200_OK
                )
            
            # Handle low confidence
            if confidence < 0.5:
                return Response(
                    {
                        "detected_type": detected_type,
                        "confidence": confidence,
                        "user_input": user_pet_type,
                        "is_match": False,
                        "message": f"Unable to verify pet type with confidence. Detected: {detected_type} ({confidence:.0%} confidence)",
                        "status": "uncertain",
                        "warning": "Low detection confidence. Please upload a clearer image."
                    },
                    status=status.HTTP_200_OK
                )
            
            # Compare pet types
            is_match = yolo_loader.compare_pet_types(detected_type, user_pet_type)
            
            # Prepare response
            response_data = {
                "detected_type": detected_type,
                "confidence": confidence,
                "user_input": user_pet_type,
                "is_match": is_match,
                "normalized_detected": yolo_loader.normalize_pet_type(detected_type),
                "normalized_input": yolo_loader.normalize_pet_type(user_pet_type),
                "all_detections": prediction.get('all_detections', [])
            }
            
            if is_match:
                response_data["message"] = "Pet type verified successfully ✅"
                response_data["status"] = "verified"
            else:
                response_data["message"] = (
                    f"Pet type mismatch. Detected: {detected_type}, "
                    f"but you entered: {user_pet_type}"
                )
                response_data["status"] = "mismatch"
                response_data["suggestion"] = f"Did you mean '{detected_type}'?"
            
            logger.info(
                f"Pet type verification complete: "
                f"detected={detected_type}, input={user_pet_type}, match={is_match}"
            )
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error in pet type verification: {e}", exc_info=True)
            return Response(
                {
                    "error": "Failed to verify pet type. Please try again.",
                    "detail": str(e),
                    "is_match": False
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
