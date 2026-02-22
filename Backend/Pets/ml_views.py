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
from ml_models.breed_classifier import breed_classifier

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



class ClassifyBreedView(APIView):
    """
    API endpoint to classify pet breed using breed classification models.
    Only works for: dog, horse, rabbit, bird
    
    POST /api/pets/classify-breed/
    
    Request:
        - image: multipart/form-data file
        - pet_type: string (dog, horse, rabbit, bird)
        - user_breed: string (optional - user entered breed for comparison)
        
    Response:
        {
            "predicted_breed": "labrador_retriever",
            "confidence": 0.87,
            "is_supported": true,
            "low_confidence": false,
            "user_breed": "labrador",
            "is_match": true,
            "normalized_predicted": "labrador_retriever",
            "normalized_input": "labrador",
            "message": "Breed classified successfully",
            "all_predictions": [...]
        }
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """Handle breed classification request."""
        try:
            # Get inputs
            image_file = request.FILES.get('image')
            pet_type = request.data.get('pet_type', '').strip()
            user_breed = request.data.get('user_breed', '').strip()
            
            # Validate inputs
            if not image_file:
                return Response(
                    {"error": "No image file provided. Please upload an image."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not pet_type:
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
            
            logger.info(f"Classifying breed for pet_type='{pet_type}', user_breed='{user_breed}'")
            
            # Check if pet type is supported
            if not breed_classifier.is_supported(pet_type):
                return Response(
                    {
                        "predicted_breed": None,
                        "confidence": 0.0,
                        "is_supported": False,
                        "low_confidence": False,
                        "message": f"Breed classification not supported for {pet_type}. Only dog, horse, rabbit, and bird are supported.",
                        "status": "not_supported"
                    },
                    status=status.HTTP_200_OK
                )
            
            # Run breed classification
            try:
                prediction = breed_classifier.predict(image_file, pet_type)
            except Exception as e:
                logger.error(f"Breed classification failed: {e}", exc_info=True)
                return Response(
                    {
                        "error": "Failed to classify breed.",
                        "detail": str(e),
                        "predicted_breed": None,
                        "confidence": 0.0,
                        "is_supported": True,
                        "status": "error"
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            predicted_breed = prediction.get('predicted_breed')
            confidence = prediction.get('confidence', 0.0)
            low_confidence = prediction.get('low_confidence', False)
            
            # Handle model not available
            if not predicted_breed:
                return Response(
                    {
                        "predicted_breed": None,
                        "confidence": 0.0,
                        "is_supported": True,
                        "low_confidence": False,
                        "message": prediction.get('message', 'Breed model not available'),
                        "status": "model_unavailable"
                    },
                    status=status.HTTP_200_OK
                )
            
            # Prepare response
            response_data = {
                "predicted_breed": predicted_breed,
                "confidence": confidence,
                "is_supported": True,
                "low_confidence": low_confidence,
                "all_predictions": prediction.get('all_predictions', []),
                "pet_type": pet_type
            }
            
            # If user provided breed, compare
            if user_breed:
                is_match = breed_classifier.compare_breeds(predicted_breed, user_breed)
                response_data.update({
                    "user_breed": user_breed,
                    "is_match": is_match,
                    "normalized_predicted": breed_classifier.normalize_breed_name(predicted_breed),
                    "normalized_input": breed_classifier.normalize_breed_name(user_breed)
                })
                
                if is_match:
                    response_data["message"] = "Verified: Entered breed matches detected breed ✅"
                    response_data["status"] = "verified"
                else:
                    response_data["message"] = f"Mismatch: Detected breed is {predicted_breed.replace('_', ' ').title()}"
                    response_data["status"] = "mismatch"
            else:
                # No user input - auto-fill scenario
                response_data["message"] = f"Breed automatically identified as: {predicted_breed.replace('_', ' ').title()}"
                response_data["status"] = "auto_filled"
                response_data["user_breed"] = None
                response_data["is_match"] = None
            
            # Add low confidence warning
            if low_confidence:
                response_data["warning"] = "Low confidence prediction. Breed may be uncertain."
            
            logger.info(
                f"Breed classification complete: "
                f"predicted={predicted_breed}, confidence={confidence:.2%}, "
                f"user_breed={user_breed}, match={response_data.get('is_match')}"
            )
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error in breed classification: {e}", exc_info=True)
            return Response(
                {
                    "error": "Failed to classify breed. Please try again.",
                    "detail": str(e),
                    "is_supported": False
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
