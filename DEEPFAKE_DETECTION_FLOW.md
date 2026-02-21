# Deepfake Detection System Flow

## Complete Integration Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  User selects image     │
                    │  in Report Form         │
                    └─────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. ImageVerificationBadge Component                               │
│     ├─ Detects file selection                                      │
│     ├─ Shows "Verifying..." spinner                                │
│     └─ Calls API automatically                                     │
│                                                                     │
│  2. API Call (services/api.ts)                                     │
│     POST /api/pets/check-image-authenticity/                       │
│     ├─ FormData with image file                                    │
│     └─ Authorization: Bearer token                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Django)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  3. API Endpoint (ml_views.py)                                     │
│     CheckImageAuthenticityView                                     │
│     ├─ Validates authentication                                    │
│     ├─ Validates file type & size                                  │
│     └─ Calls ML utils                                              │
│                                                                     │
│  4. Image Preprocessing (ml_utils.py)                              │
│     preprocess_image_for_efficientnet()                            │
│     ├─ Open with PIL                                               │
│     ├─ Convert to RGB                                              │
│     ├─ Resize to 224x224                                           │
│     ├─ Convert to numpy array                                      │
│     └─ Apply EfficientNet preprocess_input                         │
│                                                                     │
│  5. Model Inference (model_loader.py)                              │
│     DeepfakeDetectorSingleton                                      │
│     ├─ Get cached model instance                                   │
│     ├─ Run prediction                                              │
│     └─ Return probability score                                    │
│                                                                     │
│  6. Threshold Logic (ml_utils.py)                                  │
│     predict_image_authenticity()                                   │
│     ├─ if score > 0.85 → "Real" (verified)         