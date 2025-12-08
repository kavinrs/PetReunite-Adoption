from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from Pets.models import AdoptionRequest, Message, Pet

User = get_user_model()


class Command(BaseCommand):
    help = "Create test data for PetReunite application"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing test data before creating new ones",
        )

    def handle(self, *args, **options):
        if options["reset"]:
            self.stdout.write("Deleting existing test data...")
            Message.objects.all().delete()
            AdoptionRequest.objects.all().delete()
            Pet.objects.all().delete()
            User.objects.filter(username__in=["testuser", "testadmin"]).delete()

        # Create test users
        self.stdout.write("Creating test users...")

        # Create regular user
        user, created = User.objects.get_or_create(
            username="testuser",
            defaults={
                "email": "testuser@example.com",
                "first_name": "Test",
                "last_name": "User",
                "is_staff": False,
                "is_superuser": False,
            },
        )
        if created:
            user.set_password("testpass123")
            user.save()
            self.stdout.write(f"Created user: {user.username}")

        # Create admin user
        admin, created = User.objects.get_or_create(
            username="testadmin",
            defaults={
                "email": "admin@example.com",
                "first_name": "Admin",
                "last_name": "User",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            admin.set_password("adminpass123")
            admin.save()
            self.stdout.write(f"Created admin: {admin.username}")

        # Create sample adoption requests
        self.stdout.write("Creating sample adoption requests...")

        pets = Pet.objects.all()[:3]  # Get first 3 pets from fixtures

        for i, pet in enumerate(pets):
            adoption_request, created = AdoptionRequest.objects.get_or_create(
                pet=pet,
                requester=user,
                defaults={
                    "phone": f"+1-555-{1000 + i:04d}",
                    "address": f"{123 + i} Test Street, Test City, TS 12{3 + i:03d}",
                    "household_info": f"Family of {2 + i} with {i} children",
                    "experience_with_pets": f"I have had pets for {5 + i} years and volunteer at local shelter.",
                    "reason_for_adopting": f"Looking for a loving companion to join our family. {pet.name} seems like a perfect fit!",
                    "has_other_pets": i > 0,
                    "other_pets_details": f"One cat named Whiskers" if i > 0 else "",
                    "home_ownership": "own" if i % 2 == 0 else "rent",
                    "preferred_meeting": "Weekends work best for us",
                    "status": ["pending", "approved", "rejected"][i % 3],
                    "admin_notes": f"Initial review completed for {pet.name}"
                    if i > 0
                    else "",
                },
            )

            if created:
                self.stdout.write(f"Created adoption request for {pet.name}")

                # Create some sample messages
                Message.objects.create(
                    adoption_request=adoption_request,
                    sender=user,
                    text=f"Hi! I'm very interested in adopting {pet.name}. Could we schedule a meet and greet?",
                )

                Message.objects.create(
                    adoption_request=adoption_request,
                    sender=admin,
                    text=f"Hello! Thank you for your interest in {pet.name}. Let me review your application and get back to you soon.",
                )

                if i > 0:  # Add more messages for some requests
                    Message.objects.create(
                        adoption_request=adoption_request,
                        sender=user,
                        text="Thank you! I'm available this weekend if that works.",
                    )

        self.stdout.write(self.style.SUCCESS("Successfully created test data!"))
        self.stdout.write("")
        self.stdout.write("Test credentials:")
        self.stdout.write("Regular user: testuser / testpass123")
        self.stdout.write("Admin user: testadmin / adminpass123")
        self.stdout.write("")
        self.stdout.write("You can now test the adoption flow!")
