"""
API views for managing multiple photos with individual verification.
"""
import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404

from .models import FoundPetPhoto, LostPetPhoto, FoundPetReport, LostPetReport
from .serializers import FoundPetPhotoSerializer, LostPetPhotoSerializer
from .ml_utils import predict_image_authenticity, validate_image_file

logger = logging.getLogger(__name__)


class UploadFoundPetPhotosView(APIView):
    """
    Upload multiple photos for a Found Pet Report with individual verification.
    
    POST /api/pets/reports/found/<report_id>/photos/
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request, report_id):
        try:
                                                 
            report = get_object_or_404(FoundPetReport, id=report_id)
            
            if report.reporter != request.user:
                return Response(
                    {"error": "You don't have permission to add photos to this report"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
                                
            photos = request.FILES.getlist('photos')
            
            if not photos:
                return Response(
                    {"error": "No photos provided"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
                                                                                
            current_count = report.additional_photos.count()
            if current_count + len(photos) > 5:
                return Response(
                    {"error": f"Maximum 5 additional photos allowed. You have {current_count} photos."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            uploaded_photos = []
            errors = []
            
            for idx, photo_file in enumerate(photos):
                try:
                                   
                    is_valid, error_msg = validate_image_file(photo_file, max_size_mb=10)
                    if not is_valid:
                        errors.append({"file": photo_file.name, "error": error_msg})
                        continue
                    
                                               
                    verification_result = predict_image_authenticity(photo_file)
                    
                                         
                    photo = FoundPetPhoto.objects.create(
                        report=report,
                        photo=photo_file,
                        image_verification_status=verification_result['status'],
                        verification_confidence=verification_result['confidence'],
                        verification_raw_score=verification_result['raw_score'],
                        order=current_count + idx
                    )
                    
                    uploaded_photos.append(photo)
                    logger.info(f"Uploaded photo {photo.id} for report {report_id}: {verification_result['label']}")
                    
                except Exception as e:
                    logger.error(f"Error processing photo {photo_file.name}: {e}")
                    errors.append({"file": photo_file.name, "error": str(e)})
            
                               
            serializer = FoundPetPhotoSerializer(
                uploaded_photos,
                many=True,
                context={'request': request}
            )
            
            response_data = {
                "uploaded": serializer.data,
                "count": len(uploaded_photos),
                "errors": errors if errors else None
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error uploading photos: {e}", exc_info=True)
            return Response(
                {"error": "Failed to upload photos", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UploadLostPetPhotosView(APIView):
    """
    Upload multiple photos for a Lost Pet Report with individual verification.
    
    POST /api/pets/reports/lost/<report_id>/photos/
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request, report_id):
        try:
                                                 
            report = get_object_or_404(LostPetReport, id=report_id)
            
            if report.reporter != request.user:
                return Response(
                    {"error": "You don't have permission to add photos to this report"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
                                
            photos = request.FILES.getlist('photos')
            
            if not photos:
                return Response(
                    {"error": "No photos provided"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
                                 
            current_count = report.additional_photos.count()
            if current_count + len(photos) > 5:
                return Response(
                    {"error": f"Maximum 5 additional photos allowed. You have {current_count} photos."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            uploaded_photos = []
            errors = []
            
            for idx, photo_file in enumerate(photos):
                try:
                                   
                    is_valid, error_msg = validate_image_file(photo_file, max_size_mb=10)
                    if not is_valid:
                        errors.append({"file": photo_file.name, "error": error_msg})
                        continue
                    
                                               
                    verification_result = predict_image_authenticity(photo_file)
                    
                                         
                    photo = LostPetPhoto.objects.create(
                        report=report,
                        photo=photo_file,
                        image_verification_status=verification_result['status'],
                        verification_confidence=verification_result['confidence'],
                        verification_raw_score=verification_result['raw_score'],
                        order=current_count + idx
                    )
                    
                    uploaded_photos.append(photo)
                    logger.info(f"Uploaded photo {photo.id} for report {report_id}: {verification_result['label']}")
                    
                except Exception as e:
                    logger.error(f"Error processing photo {photo_file.name}: {e}")
                    errors.append({"file": photo_file.name, "error": str(e)})
            
                               
            serializer = LostPetPhotoSerializer(
                uploaded_photos,
                many=True,
                context={'request': request}
            )
            
            response_data = {
                "uploaded": serializer.data,
                "count": len(uploaded_photos),
                "errors": errors if errors else None
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error uploading photos: {e}", exc_info=True)
            return Response(
                {"error": "Failed to upload photos", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DeleteFoundPetPhotoView(APIView):
    """
    Delete a specific photo from a Found Pet Report.
    
    DELETE /api/pets/photos/found/<photo_id>/
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, photo_id):
        try:
            photo = get_object_or_404(FoundPetPhoto, id=photo_id)
            
                              
            if photo.report.reporter != request.user:
                return Response(
                    {"error": "You don't have permission to delete this photo"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
                              
            photo.photo.delete()                            
            photo.delete()                          
            
            logger.info(f"Deleted photo {photo_id} from report {photo.report.id}")
            
            return Response(
                {"message": "Photo deleted successfully"},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Error deleting photo: {e}", exc_info=True)
            return Response(
                {"error": "Failed to delete photo", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DeleteLostPetPhotoView(APIView):
    """
    Delete a specific photo from a Lost Pet Report.
    
    DELETE /api/pets/photos/lost/<photo_id>/
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, photo_id):
        try:
            photo = get_object_or_404(LostPetPhoto, id=photo_id)
            
                              
            if photo.report.reporter != request.user:
                return Response(
                    {"error": "You don't have permission to delete this photo"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
                              
            photo.photo.delete()                            
            photo.delete()                          
            
            logger.info(f"Deleted photo {photo_id} from report {photo.report.id}")
            
            return Response(
                {"message": "Photo deleted successfully"},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Error deleting photo: {e}", exc_info=True)
            return Response(
                {"error": "Failed to delete photo", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ReorderPhotosView(APIView):
    """
    Reorder photos for a report.
    
    POST /api/pets/reports/<report_type>/<report_id>/photos/reorder/
    Body: {"photo_ids": [3, 1, 2, 4]}
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, report_type, report_id):
        try:
            photo_ids = request.data.get('photo_ids', [])
            
            if not photo_ids:
                return Response(
                    {"error": "photo_ids array is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
                                             
            if report_type == 'found':
                report = get_object_or_404(FoundPetReport, id=report_id)
                PhotoModel = FoundPetPhoto
            elif report_type == 'lost':
                report = get_object_or_404(LostPetReport, id=report_id)
                PhotoModel = LostPetPhoto
            else:
                return Response(
                    {"error": "Invalid report type"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if report.reporter != request.user:
                return Response(
                    {"error": "You don't have permission to reorder these photos"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
                                         
            for order, photo_id in enumerate(photo_ids):
                PhotoModel.objects.filter(
                    id=photo_id,
                    report=report
                ).update(order=order)
            
            return Response(
                {"message": "Photos reordered successfully"},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Error reordering photos: {e}", exc_info=True)
            return Response(
                {"error": "Failed to reorder photos", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
