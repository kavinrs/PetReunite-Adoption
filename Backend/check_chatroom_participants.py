#!/usr/bin/env python
"""
Script to check chatroom participants and debug message sending issues.
Run this from the Backend directory: python check_chatroom_participants.py
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'PetPortal.settings')
django.setup()

from Pets.models import Chatroom, ChatroomParticipant, ChatroomMessage
from django.contrib.auth import get_user_model

User = get_user_model()

def check_chatrooms():
    print("\n" + "="*80)
    print("CHATROOM PARTICIPANTS CHECK")
    print("="*80 + "\n")
    
    chatrooms = Chatroom.objects.filter(is_active=True).order_by('-created_at')
    
    if not chatrooms.exists():
        print("❌ No active chatrooms found!")
        return
    
    print(f"Found {chatrooms.count()} active chatroom(s)\n")
    
    for chatroom in chatrooms:
        print(f"\n{'='*80}")
        print(f"Chatroom: {chatroom.name}")
        print(f"ID: {chatroom.id}")
        print(f"Created by: {chatroom.created_by.username if chatroom.created_by else 'Unknown'}")
        print(f"Created at: {chatroom.created_at}")
        print(f"Conversation ID: {chatroom.conversation_id if chatroom.conversation else 'None'}")
        print(f"{'='*80}")
        
        # Check participants
        participants = ChatroomParticipant.objects.filter(chatroom=chatroom)
        
        if not participants.exists():
            print("❌ NO PARTICIPANTS FOUND!")
            print("   This is why messages can't be sent!")
            print("   Solution: Add participants to this chatroom")
        else:
            print(f"\n✅ Participants ({participants.count()}):")
            for p in participants:
                status = "✅ Active" if p.is_active else "❌ Inactive"
                print(f"   - {p.user.username} (ID: {p.user.id}) - Role: {p.role} - {status}")
        
        # Check messages
        messages = ChatroomMessage.objects.filter(chatroom=chatroom).order_by('created_at')
        print(f"\n📨 Messages ({messages.count()}):")
        if messages.exists():
            for msg in messages[:5]:  # Show first 5 messages
                sender_name = msg.sender.username if msg.sender else "System"
                msg_type = "System" if msg.is_system else "User"
                print(f"   - [{msg_type}] {sender_name}: {msg.text[:50]}...")
            if messages.count() > 5:
                print(f"   ... and {messages.count() - 5} more messages")
        else:
            print("   No messages yet")
    
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    
    # Count chatrooms with no participants
    chatrooms_without_participants = 0
    for chatroom in chatrooms:
        if not ChatroomParticipant.objects.filter(chatroom=chatroom).exists():
            chatrooms_without_participants += 1
    
    if chatrooms_without_participants > 0:
        print(f"\n❌ {chatrooms_without_participants} chatroom(s) have NO participants!")
        print("   These chatrooms won't allow message sending.")
        print("   Run fix_chatroom_participants() to add participants.")
    else:
        print(f"\n✅ All chatrooms have participants!")
    
    print("\n")

def fix_chatroom_participants():
    """Add missing participants to chatrooms"""
    print("\n" + "="*80)
    print("FIXING CHATROOM PARTICIPANTS")
    print("="*80 + "\n")
    
    chatrooms = Chatroom.objects.filter(is_active=True)
    fixed_count = 0
    
    for chatroom in chatrooms:
        participants = ChatroomParticipant.objects.filter(chatroom=chatroom)
        
        if not participants.exists():
            print(f"\n❌ Chatroom '{chatroom.name}' (ID: {chatroom.id}) has no participants")
            
            # Add creator as admin
            if chatroom.created_by:
                ChatroomParticipant.objects.create(
                    chatroom=chatroom,
                    user=chatroom.created_by,
                    role='admin',
                    is_active=True
                )
                print(f"   ✅ Added {chatroom.created_by.username} as admin")
                fixed_count += 1
            
            # Add conversation user if exists
            if chatroom.conversation and chatroom.conversation.user:
                ChatroomParticipant.objects.create(
                    chatroom=chatroom,
                    user=chatroom.conversation.user,
                    role='requested_user',
                    is_active=True
                )
                print(f"   ✅ Added {chatroom.conversation.user.username} as requested_user")
                fixed_count += 1
    
    if fixed_count > 0:
        print(f"\n✅ Fixed {fixed_count} participant(s)!")
    else:
        print(f"\n✅ No fixes needed - all chatrooms have participants")
    
    print("\n")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "fix":
        fix_chatroom_participants()
    
    check_chatrooms()
    
    print("\nTo fix chatrooms with no participants, run:")
    print("  python check_chatroom_participants.py fix")
    print("\n")
#Hii
