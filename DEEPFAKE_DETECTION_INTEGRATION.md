# Deepfake Detection Integration Guide

## Overview

This document describes the complete integration of AI-based deepfake detection into the PetReunite application.

## Features

✅ Automatic image verification on upload  
✅ Real-time feedback with confidence scores  
✅ Visual badges (Green/Red/Yellow)  
✅ Database tracking of verification status  
✅ Admin panel filters and indicators  
✅ Non-blocking submission (warnings only)  
✅ Production-ready performance (<1s inference)

## Architecture

### Backend Components

1. **Model Loader** (`Backend/ml_models/model_loader.py`)
   - Singleton pattern for one-time model loading
   - Loads on Django startup
   - Thread-safe model access

2. **ML Utils** (`Backend/Pets/ml_utils.py`)
   - Image preprocessing (EfficientNetB0 format)
   - Prediction logic with thresholds
   - Image validation (type, size)

3. **API View** (`Backend/Pets/ml_views.py`)
   - `POST /api/pets/check-image-authenticity/`
   - Accepts multipart image file
   - Returns JSON with label, confidence, status

4. **Database Fields**
   - `image_verification_status` on `LostPetReport` and `FoundPetReport`
   - Choices: `verified`, `fake_detected`, `uncertain`, `not_checked`
   - Default: `not_checked`

5. **Admin Integration** (`Backend/Pets/admin.py`)
   - Colored badges in list view
   - Filter by verification status
   - Icons: ✓ (verified), ✗ (fake), ? (uncertain), — (not checked)

### Frontend Components

1. **Verification Badge** (`frontend/src/components/ImageVerificationBadge.tsx`)
   - Reusable React component
   - Auto-verifies on image selection
   - Shows real-time status with confidence
   - Displays warnings for fake/uncertain images

2. **API Integration** (`frontend/src/services/api.ts`)
   - `checkImageAuthenticity()` function
   - Handles multipart upload
   - Returns typed result

3. **Form Integration**
   - `ReportLostPet.tsx` - Lost pet form
   - `ReportFoundPet.tsx` - Found pet form
   - Badge appears below image preview
   - Automatic verification on file selection

## Installation

### 1. Install Dependencies

```bash
cd Backend
pip install -r requirements.txt
```

This installs:
- `tensorflow>=2.12.0`
- `numpy>=1.24.0`

### 2. Place Your Model

Copy your trained `.h5` model file to:

```
Backend/ml_models/deepfake_detector.h5
```

**Model Requirements:**
- Format: TensorFlow/Keras `.h5`
- Architecture: EfficientNetB0-based
- Input: 224x224x3 RGB images
- Output: Single probability (0=Fake, 1=Real)

### 3. Run Migrations

```bash
cd Backend
python manage.py migrate
```

This adds the `image_verification_status` field to both report models.

### 4. Start the Server

```bash
python manage.py runserver
```

The model will load automatically on startup. Check logs for:
```
Loading deepfake detection model...
Deepfake detection model loaded successfully
```

## Usage

### User Flow

1. User navigates to "Report Lost Pet" or "Report Found Pet"
2. User selects an image file
3. Image preview appears
4. **Automatic verification starts** (no button click needed)
5. Badge appears below preview:
   - ✅ **Green**: Real Image (Confidence: 96%)
   - ❌ **Red**: AI-Generated Image (Confidence: 94%) + Warning
   - ⚠️ **Yellow**: Uncertain (Confidence: 45%) + Warning
6. User can still submit the form (not blocked)
7. Report is saved with verification status in database

### Admin View

Admins can:
- See verification badges in report list
- Filter reports by verification status
- Review flagged reports (fake_detected)
- Override status if needed (manual field edit)

## API Endpoint

### POST `/api/pets/check-image-authenticity/`

**Request:**
```http
POST /api/pets/check-image-authenticity/
Content-Type: multipart/form-data
Authorization: Bearer <token>

image: <file>
```

**Response (Success):**
```json
{
  "label": "Real",
  "confidence": 0.96,
  "raw_score": 0.9623,
  "status": "verified"
}
```

**Response (Fake Detected):**
```json
{
  "label": "Fake",
  "confidence": 0.94,
  "raw_score": 0.0612,
  "status": "fake_detected",
  "warning": "This image appears to be AI-generated. Please upload a genuine pet photo."
}
```

**Response (Uncertain):**
```json
{
  "label": "Uncertain",
  "confidence": 0.45,
  "raw_score": 0.5234,
  "status": "uncertain",
  "warning": "Unable to verify image authenticity with high confidence. Please ensure the image is clear and genuine."
}
```

**Response (Error):**
```json
{
  "error": "Invalid image type. Allowed types: JPEG, PNG, WEBP."
}
```

## Threshold Logic

```python
if raw_score > 0.85:
    label = "Real"
    status = "verified"
elif raw_score < 0.15:
    label = "Fake"
    status = "fake_detected"
else:
    label = "Uncertain"
    status = "uncertain"
```

## Database Schema

### LostPetReport & FoundPetReport

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

## Security Considerations

1. **File Validation**
   - Max size: 10MB
   - Allowed types: JPEG, PNG, WEBP
   - PIL verification for corrupted files

2. **Authentication**
   - Endpoint requires authentication
   - Only logged-in users can verify images

3. **Rate Limiting** (Recommended)
   - Add Django rate limiting to prevent abuse
   - Suggested: 10 requests per minute per user

4. **Model Security**
   - Model file not in version control
   - Add `*.h5` to `.gitignore` if proprietary

## Performance

- **Model Loading**: Once on startup (~2-5 seconds)
- **Inference Time**: <1 second per image
- **Memory Usage**: ~500MB for EfficientNetB0
- **Concurrent Requests**: Handled by Django workers

## Testing

### Manual Testing

1. Upload a real pet photo → Should show green badge
2. Upload an AI-generated image → Should show red badge
3. Upload a low-quality/ambiguous image → May show yellow badge

### Automated Testing

```python
# Backend test
from Pets.ml_utils import predict_image_authenticity

with open('test_images/real_dog.jpg', 'rb') as f:
    result = predict_image_authenticity(f)
    assert result['status'] == 'verified'

with open('test_images/ai_generated.jpg', 'rb') as f:
    result = predict_image_authenticity(f)
    assert result['status'] == 'fake_detected'
```

## Troubleshooting

### Model Not Loading

**Error**: `Model file not found`

**Solution**:
1. Check file exists: `Backend/ml_models/deepfake_detector.h5`
2. Check file permissions
3. Verify file name is exact

### TensorFlow Import Error

**Error**: `No module named 'tensorflow'`

**Solution**:
```bash
pip install tensorflow>=2.12.0
```

### Slow Inference

**Issue**: Verification takes >3 seconds

**Solutions**:
1. Use GPU-enabled TensorFlow
2. Reduce image size before upload
3. Consider TensorFlow Lite for mobile
4. Use TensorFlow Serving for production

### Memory Issues

**Issue**: Server runs out of memory

**Solutions**:
1. Use smaller EfficientNet variant (B0 is smallest)
2. Increase server RAM
3. Implement model quantization
4. Use CPU-only TensorFlow

## Future Enhancements

- [ ] Batch verification for multiple images
- [ ] Admin override UI for verification status
- [ ] Analytics dashboard for fake detection rates
- [ ] Email alerts for high fake detection rates
- [ ] Model versioning and A/B testing
- [ ] Confidence threshold configuration in admin
- [ ] Export verification reports

## Support

For issues or questions:
1. Check logs: `Backend/logs/` (if configured)
2. Review Django admin for verification stats
3. Test with known real/fake images
4. Verify TensorFlow installation: `python -c "import tensorflow; print(tensorflow.__version__)"`

## Credits

- **Model Architecture**: EfficientNetB0 (Google)
- **Framework**: TensorFlow 2.x
- **Integration**: PetReunite Development Team
