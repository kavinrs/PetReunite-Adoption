"""
Script to populate pet_name field in existing chatrooms from their parent conversations.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'PetPortal.settings')
django.setup()

from Pets.models import Chatroom

def update_chatroom_pet_names():
    """Update pet_name for all existing chatrooms from their parent conversations."""
    chatrooms = Chatroom.objects.select_related('conversation').all()
    updated_count = 0
    
    for chatroom in chatrooms:
        if chatroom.conversation and chatroom.conversation.pet_name:
            chatroom.pet_name = chatroom.conversation.pet_name
            chatroom.save(update_fields=['pet_name'])
            updated_count += 1
            print(f"Updated chatroom {chatroom.id} ({chatroom.name}) with pet_name: {chatroom.pet_name}")
    
    print(f"\nTotal chatrooms updated: {updated_count}")

if __name__ == '__main__':
    update_chatroom_pet_names()
