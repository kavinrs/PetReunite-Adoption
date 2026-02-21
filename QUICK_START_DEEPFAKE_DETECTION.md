# Quick Start: Deepfake Detection Integration

## ✅ What's Been Done

All backend and frontend code has been implemented. Here's what's ready:

### Backend ✅
- Model loader with singleton pattern
- Image preprocessing utilities
- API endpoint for verification
- Database migrations for verification status
- Admin panel integration with badges
- TensorFlow added to requirements

### Frontend ✅
- Reusable verification badge component
- API service function
- Auto-verification on image selection

## 🚀 What You Need To Do

### Step 1: Place Your Model File

**CRITICAL**: Copy your trained `.h5` model to:

```
Backend/ml_models/deepfake_detector.h5
```

**File must be named exactly**: `deepfake_detector.h5`

### Step 2: Install Dependencies

```bash
cd Backend
pip install tensorflow>=2.12.0 numpy>=1.24.0
```

Or simply:
```bash
pip install -r requirements.txt
```

### Step 3: Run Migrations

```bash
cd Backend
python manage.py migrate
```

Expected output:
```
Running migrations:
  Applying Pets.0027_add_image_verification_status... OK
```

### Step 4: Integrate Frontend Component

You need to add the `ImageVerificationBadge` component to your report forms.

#### For ReportLostPet.tsx:

Add import at top:
```typescript
import ImageVerificationBadge from "../components/ImageVerificationBadge";
```

Add state for verification result:
```typescript
const [verificationResult, setVerificationResult] = useState<any>(null);
```

Add the badge component after the image preview (around line 200-250):
```typescript
{photo && (
  <div style={{ marginTop: 16 }}>
    <img
      src={URL.createObjectURL(photo)}
      alt="Preview"
      style={{
        maxWidth: "100%",
        maxHeight: 300,
        borderRadius: 8,
        objectFit: "contain",
      }}
    />
    <ImageVerificationBadge
      imageFile={photo}
      onVerificationComplete={(result) => setVerificationResult(result)}
    />
  </div>
)}
```

#### For ReportFoundPet.tsx:

Same changes as above - add import, state, and badge component.

### Step 5: Test the Integration

1. Start Django server:
```bash
cd Backend
python manage.py runserver
```

Check logs for:
```
Loading deepfake detection model...
Deepfake detection model loaded successfully
```

2. Start React dev server:
```bash
cd frontend
npm run dev
```

3. Test the flow:
   - Navigate to "Report Lost Pet"
   - Select an image
   - Badge should appear automatically
   - Check the verification status

## 🧪 Quick Test

Test the API directly:

```bash
# Using curl (replace with your auth token and image path)
curl -X POST http://localhost:8000/api/pets/check-image-authenticity/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/test/image.jpg"
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

## 📁 File Structure

```
Backend/
├── ml_models/
│   ├── __init__.py                    ✅ Created
│   ├── model_loader.py                ✅ Created
│   ├── deepfake_detector.h5           ❌ YOU NEED TO ADD THIS
│   └── README.md                      ✅ Created
├── Pets/
│   ├── ml_utils.py                    ✅ Created
│   ├── ml_views.py                    ✅ Created
│   ├── models.py                      ✅ Updated
│   ├── serializers.py                 ✅ Updated
│   ├── urls.py                        ✅ Updated
│   ├── admin.py                       ✅ Updated
│   ├── apps.py                        ✅ Updated
│   └── migrations/
│       └── 0027_add_image_verification_status.py  ✅ Created
└── requirements.txt                   ✅ Updated

frontend/
├── src/
│   ├── components/
│   │   └── ImageVerificationBadge.tsx ✅ Created
│   ├── services/
│   │   └── api.ts                     ✅ Updated
│   └── pages/
│       ├── ReportLostPet.tsx          ⚠️ NEEDS BADGE INTEGRATION
│       └── ReportFoundPet.tsx         ⚠️ NEEDS BADGE INTEGRATION
```

## 🎨 UI Preview

### Verified (Green Badge)
```
┌─────────────────────────────────────┐
│ [Image Preview]                     │
│                                     │
│ ✅ Real Image (Confidence: 96%)    │
└─────────────────────────────────────┘
```

### Fake Detected (Red Badge)
```
┌─────────────────────────────────────┐
│ [Image Preview]                     │
│                                     │
│ ❌ AI-Generated Image (Confidence: 94%) │
│                                     │
│ ⚠️ Warning: This image appears to  │
│ be AI-generated. Please upload a   │
│ genuine pet photo.                 │
└─────────────────────────────────────┘
```

### Uncertain (Yellow Badge)
```
┌─────────────────────────────────────┐
│ [Image Preview]                     │
│                                     │
│ ⚠️ Uncertain (Confidence: 45%)     │
│                                     │
│ ⚠️ Warning: Unable to verify image │
│ authenticity with high confidence. │
└─────────────────────────────────────┘
```

## 🔍 Verification in Admin Panel

After reports are submitted, admins will see:

```
ID | Pet Type | City  | Reporter | Image Status        | Created
---+----------+-------+----------+--------------------+---------
42 | Dog      | NYC   | john     | ✓ Verified         | 2026-02-21
43 | Cat      | LA    | jane     | ✗ Fake Detected    | 2026-02-21
44 | Bird     | SF    | bob      | ? Uncertain        | 2026-02-21
45 | Dog      | CHI   | alice    | — Not Checked      | 2026-02-21
```

Admins can filter by: Verified | Fake Detected | Uncertain | Not Checked

## ⚙️ Configuration

### Adjust Thresholds (Optional)

Edit `Backend/Pets/ml_utils.py`:

```python
# Current thresholds
if raw_score > 0.85:  # Real threshold
    label = "Real"
elif raw_score < 0.15:  # Fake threshold
    label = "Fake"
else:
    label = "Uncertain"
```

### Adjust Max File Size (Optional)

Edit `Backend/Pets/ml_views.py`:

```python
is_valid, error_message = validate_image_file(image_file, max_size_mb=10)
```

## 🐛 Common Issues

### Issue: "Model file not found"
**Solution**: Ensure file is at `Backend/ml_models/deepfake_detector.h5`

### Issue: "TensorFlow not installed"
**Solution**: `pip install tensorflow>=2.12.0`

### Issue: Badge not appearing
**Solution**: Check browser console for errors, verify API endpoint is accessible

### Issue: Slow verification (>3 seconds)
**Solution**: Consider using GPU-enabled TensorFlow or smaller model

## 📊 Monitoring

Check verification statistics:

```python
# Django shell
python manage.py shell

from Pets.models import LostPetReport, FoundPetReport

# Count by status
LostPetReport.objects.values('image_verification_status').annotate(count=Count('id'))
FoundPetReport.objects.values('image_verification_status').annotate(count=Count('id'))
```

## 🎯 Next Steps

1. ✅ Place model file
2. ✅ Install dependencies
3. ✅ Run migrations
4. ⚠️ Integrate badge in forms (see Step 4 above)
5. ✅ Test with real and fake images
6. ✅ Review admin panel
7. ✅ Deploy to production

## 📞 Need Help?

- Check `DEEPFAKE_DETECTION_INTEGRATION.md` for detailed docs
- Check `Backend/ml_models/README.md` for model specs
- Review Django logs for errors
- Test API endpoint with curl/Postman

---

**Ready to go!** Just add your model file and integrate the badge component. 🚀
