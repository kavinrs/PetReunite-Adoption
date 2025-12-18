# Backend Implementation Guide: Chat Notifications

## Overview
Extend the existing notification system to include chat-related events.

## Step 1: Update Notification Model

Add new notification types to your existing `Notification` model:

```python
# Backend/Pets/models.py

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        # ... existing types ...
        ('lost_report', 'Lost Report'),
        ('found_report', 'Found Report'),
        ('adoption_request', 'Adoption Request'),
        
        # NEW: Chat notification types
        ('chat_request', 'Chat Request'),
        ('chat_accepted', 'Chat Accepted'),
        ('chat_rejected', 'Chat Rejected'),
        ('chat_message', 'Chat Message'),
        ('chat_room_created', 'Chat Room Created'),
        ('chat_status_changed', 'Chat Status Changed'),
    ]
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications', null=True, blank=True)
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # NEW: Add reference to conversation for chat notifications
    conversation = models.ForeignKey('Conversation', on_delete=models.CASCADE, null=True, blank=True)
    
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
```

## Step 2: Create Signal Handlers for Chat Events

Create or update `Backend/Pets/signals.py`:

```python
# Backend/Pets/signals.py

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Conversation, ChatMessage, Notification

User = get_user_model()

# Store original status before save
@receiver(pre_save, sender=Conversation)
def store_original_status(sender, instance, **kwargs):
    if instance.pk:
        try:
            instance._original_status = Conversation.objects.get(pk=instance.pk).status
        except Conversation.DoesNotExist:
            instance._original_status = None
    else:
        instance._original_status = None


# 1. NEW CHAT REQUEST - Notify all admins
@receiver(post_save, sender=Conversation)
def notify_chat_request(sender, instance, created, **kwargs):
    """Notify admins when user creates a new chat request"""
    if created and instance.status in ['pending', 'requested']:
        # Get all admin users
        admins = User.objects.filter(is_staff=True, is_active=True)
        
        # Get user's name
        user_name = instance.user.get_full_name() or instance.user.username
        
        # Get the initial message/reason
        reason = instance.topic or instance.last_message_preview or "New chat request"
        
        # Create notification for each admin
        for admin in admins:
            Notification.objects.create(
                recipient=admin,
                sender=instance.user,
                notification_type='chat_request',
                conversation=instance,
                title=f'Chat Request from {user_name}',
                message=f'{user_name} requested a chat: "{reason}"',
                is_read=False
            )


# 2. CHAT ACCEPTED/REJECTED - Notify user
@receiver(post_save, sender=Conversation)
def notify_chat_status_change(sender, instance, created, **kwargs):
    """Notify user when admin accepts/rejects their chat request"""
    if not created and hasattr(instance, '_original_status'):
        old_status = instance._original_status
        new_status = instance.status
        
        # Only notify if status actually changed
        if old_status != new_status:
            if new_status == 'active' and old_status in ['pending', 'requested']:
                # Chat accepted
                Notification.objects.create(
                    recipient=instance.user,
                    sender=None,  # System/Admin action
                    notification_type='chat_accepted',
                    conversation=instance,
                    title='Chat Request Accepted',
                    message='Admin has accepted your chat request. You can now start chatting!',
                    is_read=False
                )
            
            elif new_status == 'closed' and old_status in ['pending', 'requested', 'active']:
                # Chat rejected or closed
                Notification.objects.create(
                    recipient=instance.user,
                    sender=None,
                    notification_type='chat_rejected',
                    conversation=instance,
                    title='Chat Request Closed',
                    message='Admin has closed your chat request.',
                    is_read=False
                )
            
            elif new_status == 'read_only':
                # Status changed to waiting
                Notification.objects.create(
                    recipient=instance.user,
                    sender=None,
                    notification_type='chat_status_changed',
                    conversation=instance,
                    title='Chat Status Changed',
                    message='Admin changed your chat status to "Waiting".',
                    is_read=False
                )


# 3. NEW MESSAGE - Notify recipient
@receiver(post_save, sender=ChatMessage)
def notify_new_message(sender, instance, created, **kwargs):
    """Notify recipient when a new message is sent"""
    if created and not instance.is_system:
        conversation = instance.conversation
        sender_user = instance.sender
        
        # Determine recipient
        if sender_user.is_staff:
            # Admin sent message, notify user
            recipient = conversation.user
            sender_name = "Admin"
            notification_type = 'chat_message'
            title = 'New Message from Admin'
        else:
            # User sent message, notify all admins
            admins = User.objects.filter(is_staff=True, is_active=True)
            sender_name = sender_user.get_full_name() or sender_user.username
            
            for admin in admins:
                # Skip if admin is the sender (shouldn't happen but just in case)
                if admin.id == sender_user.id:
                    continue
                    
                Notification.objects.create(
                    recipient=admin,
                    sender=sender_user,
                    notification_type='chat_message',
                    conversation=conversation,
                    title=f'New Message from {sender_name}',
                    message=f'{sender_name}: {instance.text[:100]}...' if len(instance.text) > 100 else f'{sender_name}: {instance.text}',
                    is_read=False
                )
            return  # Exit early since we handled admin notifications
        
        # Create notification for user (when admin sends message)
        message_preview = instance.text[:100] + '...' if len(instance.text) > 100 else instance.text
        Notification.objects.create(
            recipient=recipient,
            sender=sender_user,
            notification_type=notification_type,
            conversation=conversation,
            title=title,
            message=f'{sender_name}: {message_preview}',
            is_read=False
        )


# 4. CHAT ROOM CREATED - Notify user (if you implement rooms)
# This would be added when you implement the chat rooms feature
# @receiver(post_save, sender=ChatRoom)
# def notify_room_created(sender, instance, created, **kwargs):
#     if created:
#         Notification.objects.create(
#             recipient=instance.conversation.user,
#             sender=None,
#             notification_type='chat_room_created',
#             conversation=instance.conversation,
#             title='Chat Room Created',
#             message=f'Admin created a chat room: {instance.name}',
#             is_read=False
#         )
```

## Step 3: Register Signals

Make sure signals are registered in your app's `apps.py`:

```python
# Backend/Pets/apps.py

from django.apps import AppConfig

class PetsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'Pets'
    
    def ready(self):
        import Pets.signals  # Import signals to register them
```

## Step 4: Update Notification Click Handlers (Frontend)

The existing notification system should already handle clicks. Update the click handler to support chat notifications:

```typescript
// In AdminHome.tsx or UserHome.tsx notification click handler

const handleNotificationClick = (notification: any) => {
  // Mark as read
  markNotificationAsRead(notification.id);
  
  // Navigate based on notification type
  if (isAdmin) {
    // Admin navigation
    switch (notification.notification_type) {
      case 'chat_request':
        // Navigate to admin chat requests tab
        setActiveTab('chat');
        setCenterView('requests');
        break;
      
      case 'chat_message':
        // Navigate to specific conversation
        setActiveTab('chat');
        setSelectedConversationId(notification.conversation?.id);
        break;
      
      // ... other admin notification types
    }
  } else {
    // User navigation
    switch (notification.notification_type) {
      case 'chat_accepted':
      case 'chat_message':
      case 'chat_room_created':
      case 'chat_status_changed':
        // Navigate to chat tab
        setPageTab('chat');
        break;
      
      case 'chat_rejected':
        // Navigate to activity tab to see chat requests
        setPageTab('activity');
        break;
      
      // ... other user notification types
    }
  }
  
  // Close notification dropdown
  setNotificationOpen(false);
};
```

## Step 5: Run Migrations

```bash
cd Backend
python manage.py makemigrations
python manage.py migrate
```

## Step 6: Test Notification Flow

### Test Case 1: User Requests Chat
1. User creates chat request from found pet page
2. **Expected**: All admins receive notification:
   - Title: "Chat Request from [Username]"
   - Message: "[Username] requested a chat: [Reason]"
   - Click → Navigate to Admin Chat Requests

### Test Case 2: Admin Accepts Chat
1. Admin accepts pending chat request
2. **Expected**: User receives notification:
   - Title: "Chat Request Accepted"
   - Message: "Admin has accepted your chat request..."
   - Click → Navigate to Chat tab

### Test Case 3: Admin Rejects Chat
1. Admin closes/rejects chat request
2. **Expected**: User receives notification:
   - Title: "Chat Request Closed"
   - Message: "Admin has closed your chat request"
   - Click → Navigate to Activity tab

### Test Case 4: User Sends Message
1. User sends message in active chat
2. **Expected**: All admins receive notification:
   - Title: "New Message from [Username]"
   - Message: "[Username]: [Message preview]"
   - Click → Open that specific conversation

### Test Case 5: Admin Sends Message
1. Admin sends message in chat
2. **Expected**: User receives notification:
   - Title: "New Message from Admin"
   - Message: "Admin: [Message preview]"
   - Click → Navigate to Chat tab

### Test Case 6: Admin Changes Status
1. Admin changes chat status to "Waiting"
2. **Expected**: User receives notification:
   - Title: "Chat Status Changed"
   - Message: "Admin changed your chat status to 'Waiting'"
   - Click → Navigate to Chat tab

## Notification Display Format

### Admin Notifications
```
💬 Chat Request from John
From John
"I found a lost dog near Central Park..."
16 Dec, 18:39
```

```
📨 New Message from John
From John
"John: Is the dog still available?"
16 Dec, 18:45
```

### User Notifications
```
✅ Chat Request Accepted
From Admin
Admin has accepted your chat request. You can now start chatting!
16 Dec, 18:40
```

```
📨 New Message from Admin
From Admin
"Admin: Yes, the dog is still available. Can you provide more details?"
16 Dec, 18:46
```

```
❌ Chat Request Closed
From Admin
Admin has closed your chat request.
16 Dec, 19:00
```

## Summary

This implementation:
1. ✅ Uses your existing notification system
2. ✅ Adds 6 new chat notification types
3. ✅ Notifies admins when users request chat or send messages
4. ✅ Notifies users when admin accepts/rejects or sends messages
5. ✅ Includes sender name and message preview
6. ✅ Navigates to correct location on click
7. ✅ Works with existing notification UI

No new notification component needed - just extend the existing one!
