    #!/usr/bin/env python
"""
Fix existing conversations with missing or incorrect pet details
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'PetPortal.settings')
django.setup()

from Pets.models import Conversation, LostPetReport, FoundPetReport, Pet

def fix_conversations():
    """Fix all conversations with missing pet details"""
    
    print("=" * 60)
    print("Fixing Existing Conversations")
    print("=" * 60)
    
    conversations = Conversation.objects.all()
    fixed_count = 0
    
    for convo in conversations:
        if not convo.pet_unique_id:
            continue
        
        # Remove # prefix if present
        pet_unique_id = convo.pet_unique_id.lstrip('#')
        updated = False
        
        # Update pet_unique_id if it had # prefix
        if pet_unique_id != convo.pet_unique_id:
            print(f"\n✓ Fixing Conversation {convo.id}:")
            print(f"   Removing # prefix: {convo.pet_unique_id} → {pet_unique_id}")
            convo.pet_unique_id = pet_unique_id
            updated = True
        
        # Try to fill in missing pet details
        if not convo.pet_name or not convo.pet_kind:
            if pet_unique_id.startswith("LP"):
                pet = LostPetReport.objects.filter(pet_unique_id=pet_unique_id).first()
                if pet:
                    if not convo.pet_name:
                        convo.pet_name = pet.pet_name
                        print(f"   Added pet_name: {pet.pet_name}")
                        updated = True
                    if not convo.pet_kind:
                        convo.pet_kind = "lost"
                        print(f"   Added pet_kind: lost")
                        updated = True
                    if not convo.pet_id:
                        convo.pet_id = pet.id
                        print(f"   Added pet_id: {pet.id}")
                        updated = True
                else:
                    print(f"   ⚠ Pet {pet_unique_id} not found in LostPetReport")
            
            elif pet_unique_id.startswith("FP"):
                pet = FoundPetReport.objects.filter(pet_unique_id=pet_unique_id).first()
                if pet:
                    if not convo.pet_name:
                        convo.pet_name = pet.pet_type
                        print(f"   Added pet_name: {pet.pet_type}")
                        updated = True
                    if not convo.pet_kind:
                        convo.pet_kind = "found"
                        print(f"   Added pet_kind: found")
                        updated = True
                    if not convo.pet_id:
                        convo.pet_id = pet.id
                        print(f"   Added pet_id: {pet.id}")
                        updated = True
                else:
                    print(f"   ⚠ Pet {pet_unique_id} not found in FoundPetReport")
            
            elif pet_unique_id.startswith("AP"):
                pet = Pet.objects.filter(pet_unique_id=pet_unique_id).first()
                if pet:
                    if not convo.pet_name:
                        convo.pet_name = pet.name
                        print(f"   Added pet_name: {pet.name}")
                        updated = True
                    if not convo.pet_kind:
                        convo.pet_kind = "adoption"
                        print(f"   Added pet_kind: adoption")
                        updated = True
                    if not convo.pet_id:
                        convo.pet_id = pet.id
                        print(f"   Added pet_id: {pet.id}")
                        updated = True
                else:
                    print(f"   ⚠ Pet {pet_unique_id} not found in Pet table")
        
        if updated:
            convo.save()
            fixed_count += 1
    
    print(f"\n\n✓ Fixed {fixed_count} conversations")
    print("=" * 60)

if __name__ == "__main__":
    fix_conversations()
