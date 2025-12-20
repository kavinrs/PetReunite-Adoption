#!/usr/bin/env python
"""Test just the serializer validation without the full request cycle"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'PetPortal.settings')
django.setup()

from Pets.serializers import ChatMessageCreateSerializer

# Mock request object that simulates JSON request (no multipart)
class MockRequest:
    def __init__(self, content_type='application/json'):
        self.content_type = content_type
        self.FILES = {}

print("=== Test 1: JSON request with text (should pass) ===")
serializer = ChatMessageCreateSerializer(
    data={'text': 'Hello world', 'reply_to_message_id': 123},
    context={'request': MockRequest('application/json')}
)
try:
    if serializer.is_valid():
        print("✓ Validation passed")
        print(f"  Validated data: {serializer.validated_data}")
    else:
        print(f"✗ Validation failed: {serializer.errors}")
except Exception as e:
    print(f"✗ Exception: {type(e).__name__}: {e}")

print("\n=== Test 2: JSON request with empty text (should fail) ===")
serializer = ChatMessageCreateSerializer(
    data={'text': '', 'reply_to_message_id': 123},
    context={'request': MockRequest('application/json')}
)
try:
    if serializer.is_valid():
        print("✗ Validation passed (should have failed)")
    else:
        print("✓ Validation correctly failed")
        print(f"  Errors: {serializer.errors}")
except Exception as e:
    print(f"✗ Exception: {type(e).__name__}: {e}")

print("\n=== Test 3: Multipart request with file (simulated) ===")
class MockRequestWithFile:
    def __init__(self):
        self.content_type = 'multipart/form-data; boundary=----WebKitFormBoundary'
        self.FILES = {'attachment': 'mock_file.jpg'}

serializer = ChatMessageCreateSerializer(
    data={'text': ''},
    context={'request': MockRequestWithFile()}
)
try:
    if serializer.is_valid():
        print("✓ Validation passed (empty text OK with attachment)")
        print(f"  Validated data: {serializer.validated_data}")
    else:
        print(f"✗ Validation failed: {serializer.errors}")
except Exception as e:
    print(f"✗ Exception: {type(e).__name__}: {e}")

print("\n=== All serializer tests complete ===")
