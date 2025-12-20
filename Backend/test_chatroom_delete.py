"""
Test script to verify chatroom message delete endpoints
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'PetPortal.settings')
django.setup()

from django.contrib.auth import get_user_model
from Pets.models import Chatroom, ChatroomMessage, ChatroomParticipant

User = get_user_model()

# Get a chatroom with messages
chatroom = Chatroom.objects.first()
if not chatroom:
    print("No chatrooms found")
    exit()

print(f"Chatroom: {chatroom.name} (ID: {chatroom.id})")

# Get messages in this chatroom
messages = ChatroomMessage.objects.filter(chatroom=chatroom)
print(f"Messages in chatroom: {messages.count()}")

if messages.exists():
    msg = messages.first()
    print(f"First message ID: {msg.id}, Text: {msg.text[:50] if msg.text else 'No text'}")
    print(f"Sender: {msg.sender.username}")
    print(f"is_deleted: {msg.is_deleted}")
    print(f"deleted_for: {msg.deleted_for}")
    
    # Check participants
    participants = ChatroomParticipant.objects.filter(chatroom=chatroom, is_active=True)
    print(f"\nActive participants: {participants.count()}")
    for p in participants:
        print(f"  - {p.user.username} (ID: {p.user.id})")

print("\nTest complete!")
