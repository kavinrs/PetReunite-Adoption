                 
from django.conf import settings
from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ("owner", "Owner"),
        ("finder", "Finder"),
        ("staff", "ShelterStaff"),
        ("admin", "Admin"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    full_name = models.CharField(max_length=200, blank=True)
    phone_number = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    state = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    landmark = models.CharField(max_length=255, blank=True)
    location_url = models.URLField(max_length=500, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="owner")
    profile_photo = models.ImageField(upload_to="profile_photos/%Y/%m/%d/", blank=True, null=True)
    verified = models.BooleanField(default=False)
    pincode = models.CharField(max_length=10, blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True, help_text="Latitude coordinate for location")
    longitude = models.FloatField(blank=True, null=True, help_text="Longitude coordinate for location")
                                                                        
    user_unique_id = models.CharField(max_length=32, unique=True, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):                          
        """Ensure every profile has a stable, unique public user id."""
        if not self.user_unique_id:
            base = None
            if self.user_id:
                base = f"USR{self.user_id:06d}"
            else:
                base = f"USR{uuid.uuid4().hex[:8].upper()}"

            candidate = base
            suffix = 1
            while UserProfile.objects.filter(user_unique_id=candidate).exclude(pk=self.pk).exists():
                candidate = f"{base}-{suffix}"
                suffix += 1

            self.user_unique_id = candidate

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} Profile"


class VolunteerRequest(models.Model):
    EXPERIENCE_CHOICES = [
        ("beginner", "Beginner"),
        ("moderate", "Moderate"),
        ("experienced", "Experienced"),
        ("professional", "Professional vet / trainer"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="volunteer_requests")

                              
    full_name = models.CharField(max_length=200)
    date_of_birth = models.DateField(null=True, blank=True)
    phone_number = models.CharField(max_length=30)
    email = models.EmailField()

              
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10)

                                                                               
    availability = models.TextField(blank=True, help_text="Comma-separated list describing availability")
    skills = models.TextField(blank=True, help_text="Comma-separated list of skills")

    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_CHOICES)

              
    id_proof_type = models.CharField(max_length=50, blank=True)
    id_proof_document = models.FileField(
        upload_to="volunteer_id_proofs/%Y/%m/%d/", blank=True, null=True
    )

                
    motivation = models.TextField(blank=True)

                  
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    admin_notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Volunteer request by {self.full_name} ({self.user.username})"


                                     
                                                                                                
                                                 
                                                          
                                                         
                                                                 
                                                   
                                              
                                      
                                                                                        
                                                          
                                                      

                 
                                    

                        
                                                                                    


                                    
                                                                                               
                                                             
                                                 
                                                          
                                                         
                                                       
                                             
                                              
                                      
                                                                                       
                                                          
                                                      

                 
                                    

                        
                                                                                   