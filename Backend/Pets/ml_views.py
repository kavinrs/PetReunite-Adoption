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
