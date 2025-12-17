from django.core.management.base import BaseCommand
from Pets.models import Conversation, FoundPetReport, LostPetReport, Pet


class Command(BaseCommand):
    help = "Populate pet_unique_id for existing conversations that only have pet_id"

    def handle(self, *args, **options):
        conversations = Conversation.objects.filter(
            pet_id__isnull=False, pet_unique_id__isnull=True
        )
        
        updated_count = 0
        for convo in conversations:
            pet_unique_id = None
            
            # Try to find the pet based on pet_kind and pet_id
            if convo.pet_kind == "found":
                try:
                    found_pet = FoundPetReport.objects.get(id=convo.pet_id)
                    pet_unique_id = found_pet.pet_unique_id
                except FoundPetReport.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Found pet with ID {convo.pet_id} not found for conversation {convo.id}"
                        )
                    )
            elif convo.pet_kind == "lost":
                try:
                    lost_pet = LostPetReport.objects.get(id=convo.pet_id)
                    pet_unique_id = lost_pet.pet_unique_id
                except LostPetReport.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Lost pet with ID {convo.pet_id} not found for conversation {convo.id}"
                        )
                    )
            elif convo.pet_kind == "adoption":
                try:
                    adoption_pet = Pet.objects.get(id=convo.pet_id)
                    pet_unique_id = adoption_pet.pet_unique_id
                except Pet.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Adoption pet with ID {convo.pet_id} not found for conversation {convo.id}"
                        )
                    )
            else:
                # If pet_kind is not set, try all three types
                try:
                    found_pet = FoundPetReport.objects.get(id=convo.pet_id)
                    pet_unique_id = found_pet.pet_unique_id
                    convo.pet_kind = "found"
                except FoundPetReport.DoesNotExist:
                    try:
                        lost_pet = LostPetReport.objects.get(id=convo.pet_id)
                        pet_unique_id = lost_pet.pet_unique_id
                        convo.pet_kind = "lost"
                    except LostPetReport.DoesNotExist:
                        try:
                            adoption_pet = Pet.objects.get(id=convo.pet_id)
                            pet_unique_id = adoption_pet.pet_unique_id
                            convo.pet_kind = "adoption"
                        except Pet.DoesNotExist:
                            self.stdout.write(
                                self.style.WARNING(
                                    f"No pet found with ID {convo.pet_id} for conversation {convo.id}"
                                )
                            )
            
            if pet_unique_id:
                convo.pet_unique_id = pet_unique_id
                convo.save()
                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Updated conversation {convo.id}: pet_id={convo.pet_id} -> pet_unique_id={pet_unique_id}"
                    )
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f"\nSuccessfully updated {updated_count} conversations with pet_unique_id"
            )
        )
