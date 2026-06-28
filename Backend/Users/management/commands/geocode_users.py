# users/management/commands/geocode_users.py
from django.core.management.base import BaseCommand
from Users.models import UserProfile
import requests
import time


class Command(BaseCommand):
    help = 'Geocode user profiles that have city but no latitude/longitude'

    def geocode_location(self, city, state):
        """Geocode a location using Nominatim API"""
        if not city:
            return None, None
        
        # Build query with available info
        query_parts = [city]
        if state:
            query_parts.append(state)
        query_parts.append("India")  # Assuming India for now
        
        query = ", ".join(query_parts)
        
        try:
            url = f"https://nominatim.openstreetmap.org/search"
            params = {
                'q': query,
                'format': 'json',
                'limit': 1
            }
            headers = {
                'User-Agent': 'PetReunite-App/1.0'
            }
            
            response = requests.get(url, params=params, headers=headers, timeout=10)
            data = response.json()
            
            if data and len(data) > 0:
                return float(data[0]['lat']), float(data[0]['lon'])
            
            return None, None
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error geocoding {query}: {str(e)}"))
            return None, None

    def handle(self, *args, **options):
        # Get profiles with city but no coordinates
        profiles_to_geocode = UserProfile.objects.filter(
            city__isnull=False
        ).exclude(
            city=''
        ).filter(
            latitude__isnull=True
        ) | UserProfile.objects.filter(
            city__isnull=False
        ).exclude(
            city=''
        ).filter(
            longitude__isnull=True
        )

        total = profiles_to_geocode.count()
        self.stdout.write(f"Found {total} profiles to geocode")

        success = 0
        failed = 0

        for profile in profiles_to_geocode:
            self.stdout.write(f"Geocoding: {profile.full_name} - {profile.city}, {profile.state}")
            
            lat, lon = self.geocode_location(profile.city, profile.state)
            
            if lat and lon:
                profile.latitude = lat
                profile.longitude = lon
                profile.save()
                self.stdout.write(self.style.SUCCESS(f"✓ {profile.full_name}: {lat}, {lon}"))
                success += 1
            else:
                self.stdout.write(self.style.WARNING(f"✗ {profile.full_name}: Could not geocode"))
                failed += 1
            
            # Rate limiting - wait 1 second between requests
            if profiles_to_geocode.count() > 1:
                time.sleep(1)

        self.stdout.write(self.style.SUCCESS(f"\nCompleted:"))
        self.stdout.write(self.style.SUCCESS(f"  Success: {success}"))
        self.stdout.write(self.style.WARNING(f"  Failed: {failed}"))
        self.stdout.write(self.style.SUCCESS(f"  Total: {total}"))
