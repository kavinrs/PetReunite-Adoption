"""
Test script for breed classification models
Run this to verify all models load correctly
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'PetPortal.settings')
django.setup()

from ml_models.breed_classifier import breed_classifier

def test_model_loading():
    """Test loading all breed classification models"""
    print("=" * 60)
    print("BREED CLASSIFICATION MODEL TEST")
    print("=" * 60)
    print()
    
    pet_types = ['dog', 'horse', 'rabbit', 'bird']
    results = {}
    
    for pet_type in pet_types:
        print(f"Testing {pet_type.upper()} breed model...")
        print("-" * 60)
        
        try:
            # Check if supported
            is_supported = breed_classifier.is_supported(pet_type)
            print(f"  ✓ Supported: {is_supported}")
            
            if not is_supported:
                print(f"  ✗ {pet_type} is not supported")
                results[pet_type] = False
                print()
                continue
            
            # Try to load model
            model, class_names = breed_classifier.load_model(pet_type)
            
            if model is None or class_names is None:
                print(f"  ✗ Failed to load {pet_type} model")
                results[pet_type] = False
            else:
                print(f"  ✓ Model loaded successfully")
                print(f"  ✓ Number of classes: {len(class_names)}")
                print(f"  ✓ Breed classes: {', '.join(class_names[:3])}...")
                results[pet_type] = True
                
        except Exception as e:
            print(f"  ✗ Error loading {pet_type} model: {e}")
            results[pet_type] = False
        
        print()
    
    # Summary
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    success_count = sum(1 for v in results.values() if v)
    total_count = len(results)
    
    for pet_type, success in results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{pet_type.capitalize():10} : {status}")
    
    print()
    print(f"Total: {success_count}/{total_count} models loaded successfully")
    
    if success_count == total_count:
        print()
        print("🎉 ALL MODELS LOADED SUCCESSFULLY!")
        print("✅ Breed classification is ready to use!")
    else:
        print()
        print("⚠️  Some models failed to load. Check the errors above.")
        print("📝 Make sure all .pth files are in Backend/ml_models/")
    
    print("=" * 60)
    
    return success_count == total_count


def test_breed_normalization():
    """Test breed name normalization"""
    print()
    print("=" * 60)
    print("BREED NAME NORMALIZATION TEST")
    print("=" * 60)
    print()
    
    test_cases = [
        ("Labrador Retriever", "labrador_retriever"),
        ("labrador retriever", "labrador_retriever"),
        ("LABRADOR RETRIEVER", "labrador_retriever"),
        ("Labrador-Retriever", "labrador_retriever"),
        ("German Shepherd", "german_shepherd"),
        ("golden retriever", "golden_retriever"),
    ]
    
    all_passed = True
    
    for input_name, expected in test_cases:
        result = breed_classifier.normalize_breed_name(input_name)
        passed = result == expected
        status = "✅" if passed else "❌"
        
        print(f"{status} '{input_name}' → '{result}' (expected: '{expected}')")
        
        if not passed:
            all_passed = False
    
    print()
    if all_passed:
        print("✅ All normalization tests passed!")
    else:
        print("❌ Some normalization tests failed!")
    
    print("=" * 60)
    
    return all_passed


def test_breed_comparison():
    """Test breed comparison logic"""
    print()
    print("=" * 60)
    print("BREED COMPARISON TEST")
    print("=" * 60)
    print()
    
    test_cases = [
        ("labrador_retriever", "Labrador Retriever", True),
        ("labrador_retriever", "labrador", False),
        ("german_shepherd", "German Shepherd", True),
        ("german_shepherd", "german-shepherd", True),
        ("golden_retriever", "Golden Retriever", True),
        ("golden_retriever", "Labrador Retriever", False),
    ]
    
    all_passed = True
    
    for predicted, user_input, expected_match in test_cases:
        result = breed_classifier.compare_breeds(predicted, user_input)
        passed = result == expected_match
        status = "✅" if passed else "❌"
        match_str = "MATCH" if result else "NO MATCH"
        expected_str = "MATCH" if expected_match else "NO MATCH"
        
        print(f"{status} '{predicted}' vs '{user_input}' → {match_str} (expected: {expected_str})")
        
        if not passed:
            all_passed = False
    
    print()
    if all_passed:
        print("✅ All comparison tests passed!")
    else:
        print("❌ Some comparison tests failed!")
    
    print("=" * 60)
    
    return all_passed


def main():
    """Run all tests"""
    print()
    print("🔍 Starting Breed Classification Tests...")
    print()
    
    # Test 1: Model loading
    models_ok = test_model_loading()
    
    # Test 2: Breed normalization
    normalization_ok = test_breed_normalization()
    
    # Test 3: Breed comparison
    comparison_ok = test_breed_comparison()
    
    # Final summary
    print()
    print("=" * 60)
    print("FINAL RESULTS")
    print("=" * 60)
    print()
    print(f"Model Loading:      {'✅ PASS' if models_ok else '❌ FAIL'}")
    print(f"Normalization:      {'✅ PASS' if normalization_ok else '❌ FAIL'}")
    print(f"Comparison:         {'✅ PASS' if comparison_ok else '❌ FAIL'}")
    print()
    
    if models_ok and normalization_ok and comparison_ok:
        print("🎉 ALL TESTS PASSED!")
        print("✅ Breed classification is fully functional!")
        print()
        print("Next steps:")
        print("1. Start your Django server: python manage.py runserver")
        print("2. Go to 'Report Lost Pet' or 'Report Found Pet'")
        print("3. Upload a dog/horse/rabbit/bird image")
        print("4. Watch breed auto-fill or verification work!")
    else:
        print("⚠️  SOME TESTS FAILED")
        print("Please check the errors above and fix them.")
    
    print("=" * 60)
    print()


if __name__ == "__main__":
    main()
