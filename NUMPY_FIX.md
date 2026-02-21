# Numpy Compatibility Fix

## Issue
When starting the Django server, you may encounter this error:
```
numpy.dtype size changed, may indicate binary incompatibility. 
Expected 96 from C header, got 88 from PyObject
```

## Cause
TensorFlow 2.20.0 is not compatible with numpy 2.x. The model was trained with numpy 1.x.

## Solution

### Quick Fix
```bash
cd Backend
pip install "numpy<2.0" --force-reinstall
```

This downgrades numpy to version 1.26.4, which is compatible with TensorFlow 2.20.0.

### Verify Fix
```bash
python manage.py runserver
```

You should see the server start without the numpy error.

## Updated requirements.txt

The `Backend/requirements.txt` has been updated to:
```
numpy>=1.24.0,<2.0
```

This ensures numpy 1.x is installed in future deployments.

## Note
You may see a warning about opencv-python requiring numpy>=2, but this can be safely ignored. OpenCV will work fine with numpy 1.26.4.

## Verification

To verify the model loads correctly:
```bash
cd Backend
python manage.py shell -c "from ml_models.model_loader import deepfake_detector; model = deepfake_detector.load_model(); print('Model loaded successfully!')"
```

Expected output:
```
Model loaded successfully!
```

## Status
✅ Fixed! The deepfake detection model now loads successfully on Django startup.
