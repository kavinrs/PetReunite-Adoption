"""
Signal handlers for chat notifications
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Conversation, ChatMessage, Notification

User = get_user_model()


@receiver(post_save, sender=Conversation)
def notify_chat_request(sender, instance, created, **kwargs):
    """
    Notify all admins when a user creates a new chat request
    """
    if created and instance.status == 'requested':
        # Get all admin users
        admins = User.objects.filter(is_staff=True) | User.objects.filter(is_superuser=True)
        
        # Create notification for each admin
        for admin in admins:
            notification = Notification.objects.create(
                recipient=admin,
                notification_type='chat_request',
                title='New Chat Request',
                message=f'{instance.user.username} requested a chat about {instance.pet_name or "a pet"}',
                from_user=instance.user,
                conversation=instance
            )
            
            # Send real-time notification via WebSocket
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                'admin_notifications',
                {
                    'type': 'send_notification',
                    'notification_data': {
                        'id': notification.id,
                        'type': 'chat_request',
                        'title': notification.title,
                        'message': notification.message,
                        'from': instance.user.username,
                        'conversation_id': instance.id,
                        'created_at': notification.created_at.isoformat(),
                    }
                }
            )


@receiver(pre_save, sender=Conversation)
def notify_chat_status_change(sender, instance, **kwargs):
    """
    Notify user when admin accepts or rejects their chat request,
    or when chat status changes
    """
    if instance.pk:  # Only for existing conversations
        try:
            old_instance = Conversation.objects.get(pk=instance.pk)
            old_status = old_instance.status
            new_status = instance.status
            
            # Status changed
            if old_status != new_status:
                # Determine notification type and message
                if new_status == 'active' and old_status == 'requested':
                    notif_type = 'chat_accepted'
                    title = 'Chat Request Accepted'
                    message = f'Admin accepted your chat request about {instance.pet_name or "a pet"}'
                elif new_status == 'closed' and old_status in ['requested', 'pending_user']:
                    notif_type = 'chat_rejected'
                    title = 'Chat Request Closed'
                    message = f'Your chat request about {instance.pet_name or "a pet"} was closed'
                else:
                    notif_type = 'chat_status_changed'
                    title = 'Chat Status Changed'
                    message = f'Your chat status changed to {new_status}'
                
                # Create notification for user
                notification = Notification.objects.create(
                    recipient=instance.user,
                    notification_type=notif_type,
                    title=title,
                    message=message,
                    from_user=instance.admin,
                    conversation=instance
                )
                
                # Send real-time notification via WebSocket
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'user_{instance.user.id}_notifications',
                    {
                        'type': 'send_notification',
                        'notification_data': {
                            'id': notification.id,
                            'type': notif_type,
                            'title': notification.title,
                            'message': notification.message,
                            'from': 'Admin',
                            'conversation_id': instance.id,
                            'created_at': notification.created_at.isoformat(),
                        }
                    }
                )
        except Conversation.DoesNotExist:
            pass


@receiver(post_save, sender=ChatMessage)
def notify_new_message(sender, instance, created, **kwargs):
    """
    Notify recipient when a new message is sent in a conversation
    """
    if created and not instance.is_system:
        conversation = instance.conversation
        sender_user = instance.sender
        
        # Determine recipient(s)
        recipients = []
        
        # If sender is admin, notify the user
        if sender_user.is_staff or sender_user.is_superuser:
            recipients.append(conversation.user)
        else:
            # If sender is user, notify all admins
            admins = User.objects.filter(is_staff=True) | User.objects.filter(is_superuser=True)
            recipients.extend(admins)
        
        # Create notification for each recipient
        for recipient in recipients:
            # Don't notify the sender
            if recipient.id == sender_user.id:
                continue
                
            # Truncate message for preview
            message_preview = instance.text[:50] + '...' if len(instance.text) > 50 else instance.text
            
            notification = Notification.objects.create(
                recipient=recipient,
                notification_type='chat_message',
                title='New Chat Message',
                message=f'{sender_user.username}: {message_preview}',
                from_user=sender_user,
                conversation=conversation
            )
            
            # Send real-time notification via WebSocket
            channel_layer = get_channel_layer()
            
            # Determine the group name based on recipient type
            if recipient.is_staff or recipient.is_superuser:
                group_name = 'admin_notifications'
            else:
                group_name = f'user_{recipient.id}_notifications'
            
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'send_notification',
                    'notification_data': {
                        'id': notification.id,
                        'type': 'chat_message',
                        'title': notification.title,
                        'message': notification.message,
                        'from': sender_user.username,
                        'conversation_id': conversation.id,
                        'created_at': notification.created_at.isoformat(),
                    }
                }
            )
