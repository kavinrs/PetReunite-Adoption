from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from Pets.models import FoundPetReport, LostPetReport

User = get_user_model()


class Command(BaseCommand):
    help = "Create sample pet data for testing the dashboard"

    def handle(self, *args, **options):
        # Get or create a test user
        user, created = User.objects.get_or_create(
            username="sampleuser",
            defaults={
                "email": "sample@petreunite.com",
                "first_name": "Sample",
                "last_name": "User",
            },
        )
        if created:
            user.set_password("samplepass")
            user.save()

        # Create sample lost pets (3 pets)
        lost_pets_data = [
            {
                "pet_name": "Thunder",
                "pet_type": "Horse",
                "photo": "horse-image.jpeg",  # Add your horse image URL here
                "breed": "Arabian",
                "color": "Chestnut Brown",
                "age": "6 years",
                "city": "Jaipur",
                "state": "Rajasthan",
                "description": "Beautiful Arabian horse with white markings. Gentle and well-trained. Escaped from stable during storm.",
                "status": "approved",
            },
            {
                "pet_name": "Charlie",
                "pet_type": "Dog",
                "photo": "Golden-Retriever-image.jpeg",  # Add your dog image URL here
                "breed": "Labrador",
                "color": "Chocolate Brown",
                "age": "4 years",
                "city": "Pune",
                "state": "Maharashtra",
                "description": "Chocolate Labrador, very friendly and energetic. Loves to play fetch.",
                "status": "investigating",
            },
            {
                "pet_name": "Coco",
                "pet_type": "Bird",
                "photo": "parrot.jpeg",  # Add your parrot image URL here
                "breed": "Macaw Parrot",
                "color": "Red and Blue",
                "age": "3 years",
                "city": "Kochi",
                "state": "Kerala",
                "description": "Colorful macaw parrot that can speak several words. Very intelligent and social bird.",
                "status": "approved",
            },
        ]

        # Create sample found pets (4 pets)
        found_pets_data = [
            {
                "pet_type": "Rabbit",
                "photo": "Rabbit-image.jpeg",  # Add your rabbit image URL here
                "breed": "Holland Lop",
                "color": "Gray and White",
                "estimated_age": "8 months",
                "found_city": "Indore",
                "state": "Madhya Pradesh",
                "description": "Adorable Holland Lop rabbit with floppy ears found in the garden. Very gentle and good with handling.",
                "status": "approved",
            },
            {
                "pet_type": "Cat",
                "photo": "white-cat-image.jpeg",  # Add your cat image URL here
                "breed": "Tabby",
                "color": "Orange and White",
                "estimated_age": "6 months",
                "found_city": "Kolkata",
                "state": "West Bengal",
                "description": "Found a young orange tabby kitten in the rain. Very playful and healthy.",
                "status": "approved",
            },
            {
                "pet_type": "Cow",
                "photo": "cow-image.jpeg",  # Add your cow image URL here
                "breed": "Jersey",
                "color": "Brown and White",
                "estimated_age": "2 years",
                "found_city": "Mathura",
                "state": "Uttar Pradesh",
                "description": "Young Jersey cow found wandering on the highway. Gentle natured and well cared for previously.",
                "status": "approved",
            },
            {
                "pet_type": "Bird",
                "photo": "parrot.jpeg",  # Add your cockatiel image URL here
                "breed": "Cockatiel",
                "color": "Yellow and Gray",
                "estimated_age": "1 year",
                "found_city": "Chandigarh",
                "state": "Punjab",
                "description": "Friendly cockatiel with distinctive yellow crest. Can whistle tunes and is very social.",
                "status": "approved",
            },
        ]

        # Create lost pets
        for pet_data in lost_pets_data:
            lost_pet, created = LostPetReport.objects.get_or_create(
                pet_name=pet_data["pet_name"],
                pet_type=pet_data["pet_type"],
                reporter=user,
                defaults=pet_data,
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Created lost pet: {pet_data['pet_name']} ({pet_data['pet_type']})"
                    )
                )

        # Create found pets
        for pet_data in found_pets_data:
            found_pet, created = FoundPetReport.objects.get_or_create(
                pet_type=pet_data["pet_type"],
                found_city=pet_data["found_city"],
                reporter=user,
                defaults=pet_data,
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Created found pet: {pet_data['pet_type']} in {pet_data['found_city']}"
                    )
                )

        self.stdout.write(self.style.SUCCESS("Successfully created sample pet data!"))
