#!/usr/bin/env python
"""Test script to reproduce the reply message 500 error"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'PetPortal.settings')
django.setup()

from django.contrib.auth import get_user_model
from Pets.models import Conversation, ChatMessage
from Pets.serializers import ChatMessageCreateSerializer
from rest_framework.test import APIRequestFactory
from rest_framework.request import Request

User = get_user_model()

# Get the conversation and users
conversation = Conversation.objects.get(id=35)
user = conversation.user
print(f"Testing conversation {conversation.id}")
print(f"User: {user.username} (ID: {user.id})")
print(f"Status: {conversation.status}")

# Get a message to reply to
last_message = ChatMessage.objects.filter(conversation=conversation).last()
if last_message:
    print(f"Replying to message {last_message.id}: '{last_message.text[:50]}'")
else:
    print("No messages found in conversation")
    exit(1)

# Create a mock request
factory = APIRequestFactory()
request = factory.post('/api/test/', {
    'text': 'This is a test reply',
    'reply_to_message_id': last_message.id
}, format='json')
request.user = user

# Test the serializer
print("\n--- Testing Serializer ---")
serializer = ChatMessageCreateSerializer(
    data={
        'text': 'This is a test reply',
        'reply_to_message_id': last_message.id
    },
    context={'request': Request(request)}
)

try:
    if serializer.is_valid():
        print("✓ Serializer validation passed")
        print(f"Validated data: {serializer.validated_data}")
        
        # Try to save
        print("\n--- Testing Save ---")
        message = serializer.save(
            conversation=conversation,
            sender=user,
            reply_to=last_message,
            attachment=None,
            attachment_type=None,
            attachment_name=None,
            attachment_size=None
        )
        print(f"✓ Message saved successfully: ID {message.id}")
        
        # Clean up test message
        message.delete()
        print("✓ Test message cleaned up")
        
    else:
        print("✗ Serializer validation failed")
        print(f"Errors: {serializer.errors}")
except Exception as e:
    print(f"✗ Error occurred: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
