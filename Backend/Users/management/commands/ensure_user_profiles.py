"""
Management command to ensure all users have a UserProfile with user_unique_id.
This is especially important for admin users who might not have profiles yet.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from Users.models import UserProfile

User = get_user_model()


class Command(BaseCommand):
    help = 'Ensure all users (including admins) have a UserProfile with user_unique_id'

    def handle(self, *args, **options):
        users = User.objects.all()
        created_count = 0
        updated_count = 0
        
        for user in users:
            profile, created = UserProfile.objects.get_or_create(
                user=user,
                defaults={
                    'full_name': user.username,
                    'role': 'admin' if user.is_staff else 'owner'
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created profile for user: {user.username} (ID: {user.id})')
                )
            
            # Ensure user_unique_id is set
            if not profile.user_unique_id:
                profile.save()  # This will trigger the save() method which generates user_unique_id
                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Generated user_unique_id for {user.username}: {profile.user_unique_id}'
                    )
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nSummary:\n'
                f'- Created {created_count} new profiles\n'
                f'- Updated {updated_count} profiles with user_unique_id\n'
                f'- Total users processed: {users.count()}'
            )
        )
