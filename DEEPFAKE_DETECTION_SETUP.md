# Deepfake Detection Integration - Setup Guide

## Overview
This integration adds AI-powered deepfake detection to your PetReunite application. When users upload pet images in "Report Lost Pet" or "Report Found Pet" forms, the system automatically verifies if the image is real or AI-generated.

## Architecture

### Backend (Django)
- **Model**: TensorFlow EfficientNet-based binary classifier (.h5 format)
- **Location**: `Backend/ml_models/final_fake_detector_model.h5`
- **Endpoint**: `POST /api/pets/check-image-authenticity/`
- **Model Loading**: Singleton pattern - loads once on Django startup
- **Inference Time**: < 1 second

### Frontend (React)
- **Hook**: `useImageVerification` - manages verification state
- **Component**: `ImageVerificationBadge` - displays results
- **Integration**: Auto-verifies on image upload in both forms

## Setup Instructions

### 1. Backend Setup

#### Verify Model File
```bash
# Check if model exists
ls -lh Backend/ml_models/final_fake_detector_model.h5
```

#### Install Dependencies
Dependencies are already in `Backend/requirements.txt`:
```
tensorflow>=2.12.0
numpy>=1.24.0
Pillow>=10.4.0
```

Install if needed:
```bash
cd Backend
pip install -r requirements.txt
```

#### Run Migrations
The `image_verification_status` field is already added to models:
```bash
cd Backend
python manage.py migrate
```

#### Test the Backend
```bash
cd Backend
python manage.py runserver
```

The model will load automatically on startup. Check logs for:
```
Loading deepfake detection model...
Deepfake detection model loaded successfully
```

### 2. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Start Development Server
```bash
npm run dev
```

### 3. Test the Integration

#### Manual API Test
```bash
curl -X POST http://localhost:8000/api/pets/check-image-authenticity/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "image=@path/to/test_image.jpg"
```

Expected response:
```json
{
  "label": "Real",
  "confidence": 0.96,
  "raw_score": 0.9623,
  "status": "verified"
}
```

#### UI Test
1. Login to the application
2. Navigate to "Report Lost Pet" or "Report Found Pet"
3. Upload a pet image
4. Watch for automatic verification:
   - "🔍 Verifying image authenticity..." (loading)
   - Badge appears with result:
     - ✅ Real Image (Confidence: 96%) - Green
     - ❌ AI-Generated Image (Confidence: 94%) - Red
     - ⚠️ Uncertain (Confidence: 50%) - Yellow

## Model Details

### Training Configuration
- **Classes**: `['fake', 'real']` (alphabetical order)
- **Input Size**: 224x224 RGB
- **Architecture**: EfficientNet
- **Output**: Single probability value (0-1)
  - Closer to 1 → Real
  - Closer to 0 → Fake

### Inference Logic
```python
if prediction > 0.7:
    label = "Real"
    status = "verified"
elif prediction < 0.3:
    label = "Fake"
    status = "fake_detected"
else:
    label = "Uncertain"
    status = "uncertain"
```

### Preprocessing Pipeline
1. Open image with PIL
2. Convert to RGB
3. Resize to 224x224
4. Convert to numpy array
5. Add batch dimension
6. Apply EfficientNet `preprocess_input`

## Database Schema

### Fields Added
Both `LostPetReport` and `FoundPetReport` models have:

```python
image_verification_status = models.CharField(
    max_length=20,
    choices=[
        ('verified', 'Verified'),
        ('fake_detected', 'Fake Detected'),
        ('uncertain', 'Uncertain'),
        ('not_checked', 'Not Checked'),
    ],
    default='not_checked',
    help_text='AI-based verification status of the uploaded pet image'
)
```

## Security Features

### File Validation
- **Max Size**: 10MB
- **Allowed Types**: JPEG, PNG, WEBP
- **Validation**: PIL image verification
- **Authentication**: Required (IsAuthenticated)

### Error Handling
- Graceful degradation if model fails to load
- User-friendly error messages
- Detailed logging for debugging

## User Experience

### Verification Flow
1. User selects image file
2. Image preview appears
3. Automatic verification starts (< 1s)
4. Badge displays result below image
5. Warning message if fake detected
6. User can still submit (not blocked)

### Warning Messages
- **Fake**: "This image appears to be AI-generated. Please upload a genuine pet photo."
- **Uncertain**: "Image authenticity is uncertain. Please ensure you upload a clear, genuine photo."

### Badge Colors
- **Green**: Real image (confidence > 70%)
- **Red**: Fake image (confidence < 30%)
- **Yellow**: Uncertain (30-70% confidence)

## Performance Optimization

### Model Loading
- Singleton pattern ensures model loads only once
- Loaded on Django startup (not per request)
- Cached in memory for fast inference

### API Response Time
- Target: < 1 second
- Typical: 200-500ms
- Includes: upload, preprocessing, inference, response

## Troubleshooting

### Model Not Loading
**Error**: "Model file not found"
**Solution**: Ensure `Backend/ml_models/final_fake_detector_model.h5` exists

**Error**: "Failed to load model"
**Solution**: Check TensorFlow version compatibility

### Slow Inference
**Issue**: Verification takes > 2 seconds
**Solutions**:
- Check CPU/GPU availability
- Verify model is loaded (not reloading per request)
- Check image file size (should be < 10MB)

### Frontend Not Showing Badge
**Issue**: Badge doesn't appear after upload
**Solutions**:
- Check browser console for errors
- Verify API endpoint is accessible
- Check authentication token is valid

## File Structure

```
Backend/
├── ml_models/
│   ├── __init__.py
│   ├── final_fake_detector_model.h5  # Your trained model
│   ├── model_loader.py                # Singleton model loader
│   └── README.md
├── Pets/
│   ├── ml_views.py                    # API endpoint
│   ├── ml_utils.py                    # Preprocessing & prediction
│   ├── models.py                      # Updated with verification field
│   ├── apps.py                        # Model loading on startup
│   └── urls.py                        # URL routing

frontend/
├── src/
│   ├── components/
│   │   └── ImageVerificationBadge.tsx # Badge component
│   ├── hooks/
│   │   └── useImageVerification.ts    # Verification hook
│   ├── pages/
│   │   ├── ReportLostPet.tsx          # Updated with verification
│   │   └── ReportFoundPet.tsx         # Updated with verification
│   └── services/
│       └── api.ts                     # API client (already has function)
```

## API Reference

### Check Image Authenticity

**Endpoint**: `POST /api/pets/check-image-authenticity/`

**Authentication**: Required (Bearer token)

**Request**:
```
Content-Type: multipart/form-data

image: <file>
```

**Response** (Success - 200):
```json
{
  "label": "Real" | "Fake" | "Uncertain",
  "confidence": 0.96,
  "raw_score": 0.9623,
  "status": "verified" | "fake_detected" | "uncertain",
  "warning": "Optional warning message"
}
```

**Response** (Error - 400):
```json
{
  "error": "No image file provided. Please upload an image."
}
```

**Response** (Error - 500):
```json
{
  "error": "Failed to process image. Please try again.",
  "detail": "Error details"
}
```

## Production Deployment

### Environment Variables
No additional environment variables required.

### Docker Considerations
If using Docker, ensure:
1. Model file is copied to container
2. TensorFlow dependencies are installed
3. Sufficient memory allocated (recommend 2GB+)

### Performance Monitoring
Monitor these metrics:
- Model loading time on startup
- Average inference time per request
- API endpoint response time
- Error rate

## Future Enhancements

### Potential Improvements
1. **Batch Processing**: Verify multiple images at once
2. **Caching**: Cache results for identical images
3. **Admin Dashboard**: View verification statistics
4. **Model Updates**: Hot-reload new model versions
5. **Confidence Tuning**: Adjust thresholds based on feedback

### Model Retraining
To update the model:
1. Train new model with same architecture
2. Save as `.h5` file
3. Replace `Backend/ml_models/final_fake_detector_model.h5`
4. Restart Django server
5. Model automatically reloads

## Support

### Logs Location
- **Django**: Check console output or configured log files
- **Frontend**: Browser console (F12)

### Debug Mode
Enable detailed logging in Django settings:
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'ml_models': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'Pets': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

## Summary

The deepfake detection integration is now complete and production-ready:

✅ Backend API endpoint configured
✅ Model loads automatically on startup
✅ Frontend forms integrated with auto-verification
✅ User-friendly badge display
✅ Security validations in place
✅ Database fields added
✅ Error handling implemented
✅ Performance optimized (< 1s inference)

Users can now upload pet images with confidence, knowing the system will automatically detect AI-generated fakes!
