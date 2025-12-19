#!/usr/bin/env python
"""
Diagnostic script to check if chatroom invitation system is set up correctly.
Run this from the Backend directory: python check_invitation_setup.py
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'PetPortal.settings')
django.setup()

from django.contrib.auth import get_user_model
from Pets.models import (
    ChatroomAccessRequest,
    Chatroom,
    Notification,
    Conversation,
    LostPetReport,
    FoundPetReport
)

User = get_user_model()

def check_models():
    """Check if all required models exist and have correct fields"""
    print("=" * 60)
    print("CHECKING MODELS")
    print("=" * 60)
    
    # Check ChatroomAccessRequest
    print("\n1. ChatroomAccessRequest Model:")
    try:
        fields = [f.name for f in ChatroomAccessRequest._meta.get_fields()]
        required_fields = [
            'chatroom', 'pet', 'pet_unique_id', 'pet_kind',
            'requested_user', 'added_by', 'conversation',
            'role', 'request_type', 'status'
        ]
        missing = [f for f in required_fields if f not in fields]
        if missing:
            print(f"   ❌ Missing fields: {missing}")
        else:
            print("   ✅ All required fields present")
            
        # Check request_type choices
        choices = dict(ChatroomAccessRequest._meta.get_field('request_type').choices)
        if 'chatroom_creation_request' in choices:
            print("   ✅ 'chatroom_creation_request' choice exists")
        else:
            print("   ❌ 'chatroom_creation_request' choice missing")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Check Notification
    print("\n2. Notification Model:")
    try:
        fields = [f.name for f in Notification._meta.get_fields()]
        if 'chatroom_access_request' in fields:
            print("   ✅ chatroom_access_request field exists")
        else:
            print("   ❌ chatroom_access_request field missing")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Check Chatroom
    print("\n3. Chatroom Model:")
    try:
        fields = [f.name for f in Chatroom._meta.get_fields()]
        required_fields = ['name', 'conversation', 'pet_unique_id', 'pet_kind']
        missing = [f for f in required_fields if f not in fields]
        if missing:
            print(f"   ❌ Missing fields: {missing}")
        else:
            print("   ✅ All required fields present")
    except Exception as e:
        print(f"   ❌ Error: {e}")

def check_data():
    """Check existing data"""
    print("\n" + "=" * 60)
    print("CHECKING DATA")
    print("=" * 60)
    
    print(f"\n1. Users: {User.objects.count()} total")
    print(f"   - Admins: {User.objects.filter(is_staff=True).count()}")
    print(f"   - Regular users: {User.objects.filter(is_staff=False).count()}")
    
    print(f"\n2. Conversations: {Conversation.objects.count()} total")
    with_pet = Conversation.objects.exclude(pet_unique_id='').exclude(pet_unique_id=None).count()
    print(f"   - With pet context: {with_pet}")
    print(f"   - Without pet context: {Conversation.objects.count() - with_pet}")
    
    print(f"\n3. Pet Reports:")
    print(f"   - Lost: {LostPetReport.objects.count()}")
    print(f"   - Found: {FoundPetReport.objects.count()}")
    
    print(f"\n4. Chatroom Access Requests: {ChatroomAccessRequest.objects.count()} total")
    if ChatroomAccessRequest.objects.exists():
        pending = ChatroomAccessRequest.objects.filter(status='pending').count()
        accepted = ChatroomAccessRequest.objects.filter(status='accepted').count()
        rejected = ChatroomAccessRequest.objects.filter(status='rejected').count()
        print(f"   - Pending: {pending}")
        print(f"   - Accepted: {accepted}")
        print(f"   - Rejected: {rejected}")
        
        creation_requests = ChatroomAccessRequest.objects.filter(
            request_type='chatroom_creation_request'
        ).count()
        print(f"   - Creation requests: {creation_requests}")
    
    print(f"\n5. Chatrooms: {Chatroom.objects.count()} total")
    
    print(f"\n6. Notifications: {Notification.objects.count()} total")
    if Notification.objects.exists():
        invitation_notifs = Notification.objects.filter(
            notification_type='chatroom_invitation'
        ).count()
        print(f"   - Chatroom invitations: {invitation_notifs}")

def check_recent_invitations():
    """Check recent invitation requests"""
    print("\n" + "=" * 60)
    print("RECENT INVITATION REQUESTS (Last 5)")
    print("=" * 60)
    
    requests = ChatroomAccessRequest.objects.all().order_by('-created_at')[:5]
    if not requests:
        print("\n   No invitation requests found")
        return
    
    for req in requests:
        print(f"\n   Request #{req.id}:")
        print(f"   - User: {req.requested_user.username}")
        print(f"   - Added by: {req.added_by.username}")
        print(f"   - Pet: {req.pet_unique_id} ({req.pet_kind})")
        print(f"   - Type: {req.request_type}")
        print(f"   - Status: {req.status}")
        print(f"   - Created: {req.created_at}")
        
        # Check if notification was created
        notif = Notification.objects.filter(
            chatroom_access_request=req
        ).first()
        if notif:
            print(f"   - Notification: ✅ Created (read: {notif.is_read})")
        else:
            print(f"   - Notification: ❌ Not found")

def check_test_users():
    """Check if test users exist"""
    print("\n" + "=" * 60)
    print("CHECKING TEST USERS")
    print("=" * 60)
    
    test_usernames = ['lohith ss', 'vijay', 'joseph vijay', 'lohith']
    
    for username in test_usernames:
        user = User.objects.filter(username__icontains=username).first()
        if user:
            print(f"\n   ✅ Found: {user.username} (ID: {user.id})")
            # Check if user has any invitations
            invitations = ChatroomAccessRequest.objects.filter(
                requested_user=user
            ).count()
            print(f"      - Invitations: {invitations}")
            
            # Check if user has any notifications
            notifications = Notification.objects.filter(
                recipient=user,
                notification_type='chatroom_invitation'
            ).count()
            print(f"      - Notifications: {notifications}")
        else:
            print(f"\n   ❌ Not found: {username}")

def main():
    print("\n" + "=" * 60)
    print("CHATROOM INVITATION SYSTEM DIAGNOSTIC")
    print("=" * 60)
    
    try:
        check_models()
        check_data()
        check_recent_invitations()
        check_test_users()
        
        print("\n" + "=" * 60)
        print("DIAGNOSTIC COMPLETE")
        print("=" * 60)
        print("\nIf you see any ❌ marks above, those need to be fixed.")
        print("If everything shows ✅, the system is set up correctly.")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
