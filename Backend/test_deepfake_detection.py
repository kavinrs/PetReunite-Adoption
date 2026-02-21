"""
Test script for deepfake detection integration.
Run this to verify the model loads and works correctly.

Usage:
    python test_deepfake_detection.py
"""
import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'PetPortal.settings')
django.setup()

def test_model_loading():
    """Test if the model loads successfully"""
    print("=" * 60)
    print("TEST 1: Model Loading")
    print("=" * 60)
    
    try:
        from ml_models.model_loader import deepfake_detector
        
        print("✓ Importing model loader... OK")
        
        model = deepfake_detector.load_model()
        print("✓ Loading model... OK")
        
        print(f"✓ Model type: {type(model)}")
        print(f"✓ Model loaded: {deepfake_detector._model_loaded}")
        
        # Check model architecture
        if hasattr(model, 'input_shape'):
            print(f"✓ Input shape: {model.input_shape}")
        if hasattr(model, 'output_shape'):
            print(f"✓ Output shape: {model.output_shape}")
        
        print("\n✅ Model loading test PASSED!\n")
        return True
        
    except Exception as e:
        print(f"\n❌ Model loading test FAILED!")
        print(f"Error: {e}\n")
        import traceback
        traceback.print_exc()
        return False


def test_preprocessing():
    """Test image preprocessing"""
    print("=" * 60)
    print("TEST 2: Image Preprocessing")
    print("=" * 60)
    
    try:
        from Pets.ml_utils import preprocess_image_for_efficientnet
        from PIL import Image
        import numpy as np
        import io
        
        print("✓ Importing preprocessing utilities... OK")
        
        # Create a dummy image
        dummy_image = Image.new('RGB', (500, 500), color='red')
        img_bytes = io.BytesIO()
        dummy_image.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        print("✓ Created test image (500x500 RGB)... OK")
        
        # Preprocess
        processed = preprocess_image_for_efficientnet(img_bytes)
        
        print(f"✓ Preprocessed shape: {processed.shape}")
        print(f"✓ Expected shape: (1, 224, 224, 3)")
        
        assert processed.shape == (1, 224, 224, 3), "Shape mismatch!"
        print("✓ Shape validation... OK")
        
        print("\n✅ Preprocessing test PASSED!\n")
        return True
        
    except Exception as e:
        print(f"\n❌ Preprocessing test FAILED!")
        print(f"Error: {e}\n")
        import traceback
        traceback.print_exc()
        return False


def test_prediction():
    """Test prediction pipeline"""
    print("=" * 60)
    print("TEST 3: Prediction Pipeline")
    print("=" * 60)
    
    try:
        from Pets.ml_utils import predict_image_authenticity
        from PIL import Image
        import io
        
        print("✓ Importing prediction utilities... OK")
        
        # Create a dummy image
        dummy_image = Image.new('RGB', (500, 500), color='blue')
        img_bytes = io.BytesIO()
        dummy_image.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        print("✓ Created test image... OK")
        
        # Run prediction
        result = predict_image_authenticity(img_bytes)
        
        print(f"✓ Prediction result: {result}")
        
        # Validate result structure
        assert 'label' in result, "Missing 'label' in result"
        assert 'confidence' in result, "Missing 'confidence' in result"
        assert 'raw_score' in result, "Missing 'raw_score' in result"
        assert 'status' in result, "Missing 'status' in result"
        
        print(f"✓ Label: {result['label']}")
        print(f"✓ Confidence: {result['confidence']:.4f}")
        print(f"✓ Raw Score: {result['raw_score']:.4f}")
        print(f"✓ Status: {result['status']}")
        
        # Validate label
        assert result['label'] in ['Real', 'Fake', 'Uncertain'], "Invalid label"
        print("✓ Label validation... OK")
        
        # Validate status
        assert result['status'] in ['verified', 'fake_detected', 'uncertain'], "Invalid status"
        print("✓ Status validation... OK")
        
        print("\n✅ Prediction test PASSED!\n")
        return True
        
    except Exception as e:
        print(f"\n❌ Prediction test FAILED!")
        print(f"Error: {e}\n")
        import traceback
        traceback.print_exc()
        return False


def test_file_validation():
    """Test file validation"""
    print("=" * 60)
    print("TEST 4: File Validation")
    print("=" * 60)
    
    try:
        from Pets.ml_utils import validate_image_file
        from PIL import Image
        import io
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        print("✓ Importing validation utilities... OK")
        
        # Test valid image
        valid_image = Image.new('RGB', (100, 100), color='green')
        img_bytes = io.BytesIO()
        valid_image.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        uploaded_file = SimpleUploadedFile(
            "test.jpg",
            img_bytes.read(),
            content_type="image/jpeg"
        )
        
        is_valid, error = validate_image_file(uploaded_file, max_size_mb=10)
        
        print(f"✓ Valid image test: {is_valid}")
        assert is_valid, f"Valid image rejected: {error}"
        print("✓ Valid image accepted... OK")
        
        # Test oversized file
        large_bytes = b'x' * (11 * 1024 * 1024)  # 11 MB
        large_file = SimpleUploadedFile(
            "large.jpg",
            large_bytes,
            content_type="image/jpeg"
        )
        
        is_valid, error = validate_image_file(large_file, max_size_mb=10)
        
        print(f"✓ Oversized file test: {not is_valid}")
        assert not is_valid, "Oversized file not rejected"
        print(f"✓ Oversized file rejected... OK (Error: {error})")
        
        print("\n✅ File validation test PASSED!\n")
        return True
        
    except Exception as e:
        print(f"\n❌ File validation test FAILED!")
        print(f"Error: {e}\n")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("DEEPFAKE DETECTION INTEGRATION TEST SUITE")
    print("=" * 60 + "\n")
    
    results = []
    
    # Run tests
    results.append(("Model Loading", test_model_loading()))
    results.append(("Image Preprocessing", test_preprocessing()))
    results.append(("Prediction Pipeline", test_prediction()))
    results.append(("File Validation", test_file_validation()))
    
    # Summary
    print("=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name:.<40} {status}")
    
    print("=" * 60)
    
    total = len(results)
    passed = sum(1 for _, p in results if p)
    
    print(f"\nTotal: {total} tests")
    print(f"Passed: {passed} tests")
    print(f"Failed: {total - passed} tests")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Integration is working correctly!")
        return 0
    else:
        print("\n⚠️ SOME TESTS FAILED! Please check the errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
