#!/usr/bin/env python
"""Test the actual API endpoint for reply messages"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'PetPortal.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from Pets.models import Conversation, ChatMessage
from Pets.views import UserChatMessageListCreateView
import json

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
    print(f"Replying to message {last_message.id}: '{last_message.text[:50] if last_message.text else '(no text)'}'")
else:
    print("No messages found in conversation")
    exit(1)

# Create a request
factory = RequestFactory()

# Test 1: JSON request with text and reply_to
print("\n=== Test 1: JSON request with text and reply_to ===")
request = factory.post(
    f'/api/pets/chat/conversations/{conversation.id}/messages/',
    data=json.dumps({
        'text': 'This is a test reply via JSON',
        'reply_to_message_id': last_message.id
    }),
    content_type='application/json'
)
request.user = user

view = UserChatMessageListCreateView.as_view()
try:
    response = view(request, conversation_id=conversation.id)
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print("✓ Message created successfully")
        # Clean up
        ChatMessage.objects.filter(text='This is a test reply via JSON').delete()
    else:
        print(f"✗ Failed: {response.data if hasattr(response, 'data') else response.content}")
except Exception as e:
    print(f"✗ Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

# Test 2: JSON request with empty text (should fail)
print("\n=== Test 2: JSON request with empty text (should fail with 400) ===")
request = factory.post(
    f'/api/pets/chat/conversations/{conversation.id}/messages/',
    data=json.dumps({
        'text': '',
        'reply_to_message_id': last_message.id
    }),
    content_type='application/json'
)
request.user = user

view = UserChatMessageListCreateView.as_view()
try:
    response = view(request, conversation_id=conversation.id)
    print(f"Status: {response.status_code}")
    if response.status_code == 400:
        print("✓ Correctly rejected empty message")
        print(f"Error: {response.data if hasattr(response, 'data') else response.content}")
    else:
        print(f"✗ Unexpected status: {response.status_code}")
except Exception as e:
    print(f"✗ Error: {type(e).__name__}: {e}")

print("\n=== All tests complete ===")
