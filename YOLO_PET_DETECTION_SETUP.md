# YOLO Pet Type Detection - Setup Guide

## 🎯 Overview

This feature adds YOLO-based pet type detection to verify that the uploaded image matches the user-entered pet type.

**Flow:**
1. User uploads image → Deepfake detection runs
2. If image is REAL → YOLO pet type detection runs
3. User enters pet type → System compares with YOLO detection
4. If match → Show "Verified ✅" → Enable submission
5. If mismatch → Show "Wrong Pet Type ❌" → Show alert → Block submission

---

## 📦 Installation Steps

### Step 1: Install Python Dependencies

```bash
cd Backend
pip install -r requirements.txt
```

**New packages added:**
- `ultralytics>=8.0.0` - YOLO framework
- `torch>=2.0.0` - PyTorch
- `torchvision>=0.15.0` - PyTorch vision utilities

### Step 2: Upload YOLO Model File

**🚨 UPLOAD NOW: Place your `best.pt` file here:**

```
Backend/ml_models/best.pt
```

**File structure should look like:**
```
Backend/
├── ml_models/
│   ├── __init__.py
│   ├── model_loader.py (deepfake model)
│   ├── yolo_loader.py (NEW - YOLO model)
│   ├── final_fake_detector_model.h5 (deepfake model file)
│   └── best.pt (NEW - YOLO model file) ← UPLOAD HERE
```

### Step 3: Verify Model Classes

The YOLO model is configured for these classes in exact order:
```python
# Index : Class Name
0: 'dog'
1: 'cat'
2: 'horse'
3: 'cow'
4: 'sheep'
5: 'goat'
6: 'bird'
7: 'rabbit'
8: 'hamster'
9: 'iguana'
10: 'sugar_glider'
```

**✅ This matches your model's training configuration!**

**⚠️ Important:** If your model has different classes, update `Backend/ml_models/yolo_loader.py` line 18.

### Step 4: Test Backend

```bash
cd Backend
python manage.py shell
```

```python
from ml_models.yolo_loader import yolo_loader

# Test model loading
model = yolo_loader.load_model()
print("✅ YOLO model loaded successfully")

# Test prediction (use a test image path)
result = yolo_loader.predict('path/to/test/dog/image.jpg')
print(f"Detected: {result['detected_class']} (confidence: {result['confidence']:.2f})")

# Test comparison
is_match = yolo_loader.compare_pet_types('dog', 'Dog')
print(f"Match: {is_match}")  # Should be True

is_match = yolo_loader.compare_pet_types('dog', 'cat')
print(f"Match: {is_match}")  # Should be False
```

### Step 5: Restart Django Server

```bash
python manage.py runserver
```

---

## 🔧 Backend Implementation

### Files Created/Modified:

1. **`Backend/ml_models/yolo_loader.py`** (NEW)
   - Singleton YOLO model loader
   - Handles prediction and comparison
   - Normalizes pet type names (case-insensitive, handles spaces/underscores)

2. **`Backend/Pets/ml_views.py`** (MODIFIED)
   - Added `VerifyPetTypeView` API endpoint
   - Endpoint: `POST /api/pets/verify-pet-type/`

3. **`Backend/Pets/urls.py`** (MODIFIED)
   - Added route for pet type verification

4. **`Backend/requirements.txt`** (MODIFIED)
   - Added ultralytics, torch, torchvision

### API Endpoint Details:

**Endpoint:** `POST /api/pets/verify-pet-type/`

**Request:**
```
Content-Type: multipart/form-data

image: <file>
pet_type: "dog"
```

**Response (Match):**
```json
{
  "detected_type": "dog",
  "confidence": 0.95,
  "user_input": "dog",
  "is_match": true,
  "status": "verified",
  "message": "Pet type verified successfully ✅"
}
```

**Response (Mismatch):**
```json
{
  "detected_type": "cat",
  "confidence": 0.92,
  "user_input": "dog",
  "is_match": false,
  "status": "mismatch",
  "message": "Pet type mismatch. Detected: cat, but you entered: dog",
  "suggestion": "Did you mean 'cat'?"
}
```

**Response (Low Confidence):**
```json
{
  "detected_type": "bird",
  "confidence": 0.45,
  "user_input": "bird",
  "is_match": false,
  "status": "uncertain",
  "message": "Unable to verify pet type with confidence...",
  "warning": "Low detection confidence. Please upload a clearer image."
}
```

---

## 🎨 Frontend Implementation

### Files Created:

1. **`frontend/src/hooks/usePetTypeVerification.ts`** (NEW)
   - Custom hook for pet type verification
   - Manages verification state
   - Handles alert display logic

2. **`frontend/src/components/PetTypeMismatchAlert.tsx`** (NEW)
   - Alert component for pet type mismatch
   - Shows once per mismatch
   - Auto-dismisses after 8 seconds

3. **`frontend/src/services/api.ts`** (MODIFIED)
   - Added `verifyPetType()` function

### Files to be Modified (Next Step):

4. **`frontend/src/pages/ReportLostPet.tsx`** (TO BE MODIFIED)
   - Integrate pet type verification
   - Add verification UI
   - Control submit button

5. **`frontend/src/pages/ReportFoundPet.tsx`** (TO BE MODIFIED)
   - Same as above

---

## 🔄 Integration Flow

### 1. Image Upload Flow:
```
User uploads image
↓
Deepfake detection runs (existing)
↓
IF Fake → Show fake alert, block submission
↓
IF Real → Continue to pet type verification
```

### 2. Pet Type Verification Flow:
```
User enters pet type in input field
↓
On blur/change → Trigger YOLO verification
↓
YOLO detects pet type
↓
Compare detected vs entered
↓
IF Match:
  - Show "Verified ✅" below input
  - Enable submit button
↓
IF Mismatch:
  - Show "Wrong Pet Type ❌" below input
  - Show popup alert (once)
  - Disable submit button
  - Show suggestion: "Did you mean 'cat'?"
```

### 3. Submit Button Logic:
```
Disabled when:
- No photo uploaded
- Deepfake detected (fake image)
- Pet type mismatch
- YOLO verification in progress

Enabled when:
- Photo uploaded
- Deepfake passed (real image)
- Pet type verified (match)
```

---

## 🎯 Key Features

### 1. Case-Insensitive Matching
```
"Dog" = "dog" = "DOG" ✅
"Sugar Glider" = "sugar_glider" = "sugar glider" ✅
```

### 2. Smart Comparison
- Handles spaces vs underscores
- Trims whitespace
- Normalizes input

### 3. Confidence Handling
- High confidence (≥0.5): Show result
- Low confidence (<0.5): Show warning, allow submission
- No detection: Show error, allow submission

### 4. Alert Behavior
- Shows once per mismatch event
- Doesn't re-trigger on every keystroke
- Auto-dismisses after 8 seconds
- Can be manually closed

### 5. Performance
- YOLO model loaded once (singleton pattern)
- Async verification (doesn't block UI)
- Debounced input (prevents excessive API calls)

---

## 🧪 Testing Checklist

### Backend Tests:

```bash
# Test 1: Model loading
python manage.py shell
>>> from ml_models.yolo_loader import yolo_loader
>>> model = yolo_loader.load_model()
>>> print("✅ Model loaded")

# Test 2: Prediction
>>> result = yolo_loader.predict('path/to/dog.jpg')
>>> print(result)

# Test 3: Comparison
>>> yolo_loader.compare_pet_types('dog', 'Dog')  # True
>>> yolo_loader.compare_pet_types('dog', 'cat')  # False
>>> yolo_loader.compare_pet_types('sugar_glider', 'sugar glider')  # True
```

### Frontend Tests (After Integration):

1. ✅ Upload dog image, enter "dog" → Should show "Verified ✅"
2. ✅ Upload cat image, enter "dog" → Should show "Wrong Pet Type ❌" + alert
3. ✅ Upload dog image, enter "Dog" (capital) → Should show "Verified ✅"
4. ✅ Upload sugar glider image, enter "sugar glider" (with space) → Should show "Verified ✅"
5. ✅ Fake image → Should NOT run YOLO, only show fake alert
6. ✅ Change pet type after mismatch → Should re-verify
7. ✅ Submit button disabled when mismatch
8. ✅ Submit button enabled when verified

---

## 📝 Next Steps

### I will now integrate into the form pages:

1. Modify `ReportLostPet.tsx`:
   - Add pet type verification hook
   - Add verification UI below pet_type input
   - Add mismatch alert
   - Update submit button logic

2. Modify `ReportFoundPet.tsx`:
   - Same as above

3. Test end-to-end flow

---

## 🚨 IMPORTANT: Upload Model File Now!

**Before proceeding, please upload your `best.pt` file to:**
```
Backend/ml_models/best.pt
```

**Once uploaded, confirm and I'll continue with the frontend integration!**

---

## 📊 Model Information

**Supported Pet Types (Index Order):**
- 0: dog
- 1: cat
- 2: horse
- 3: cow
- 4: sheep
- 5: goat
- 6: bird
- 7: rabbit
- 8: hamster
- 9: iguana
- 10: sugar_glider

**Model Format:** PyTorch YOLO (.pt)
**Framework:** Ultralytics YOLOv8
**Input:** RGB image (any size, will be resized by YOLO)
**Output:** Class predictions with confidence scores

---

## 🔍 Troubleshooting

### Issue: "YOLO model file not found"
**Solution:** Upload `best.pt` to `Backend/ml_models/best.pt`

### Issue: "ultralytics package not installed"
**Solution:** Run `pip install -r requirements.txt`

### Issue: "Model classes don't match"
**Solution:** Update `CLASSES` list in `yolo_loader.py`

### Issue: "Low confidence detections"
**Solution:** This is normal for unclear images. System allows submission with warning.

### Issue: "Verification too slow"
**Solution:** YOLO runs on first request (model loading). Subsequent requests are fast.

---

## ✅ Status

- [x] Backend YOLO loader created
- [x] API endpoint created
- [x] Frontend hook created
- [x] Alert component created
- [x] API service function added
- [ ] **WAITING: Upload best.pt file**
- [ ] Frontend form integration (ReportLostPet)
- [ ] Frontend form integration (ReportFoundPet)
- [ ] End-to-end testing

**Ready for model file upload!** 🚀
