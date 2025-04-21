from django.conf import settings
from django.db import models
from django.contrib.auth.models import User

class Announcement(models.Model):
    title = models.CharField(max_length=200)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    seen_by = models.ManyToManyField(User, blank=True, related_name='seen_announcements')

    def __str__(self):
        return self.title

class Attraction(models.Model):
    name        = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    address     = models.CharField(max_length=255, blank=True)
    category    = models.CharField(max_length=50, blank=True)
    # Optional if you want map pins:
    latitude    = models.FloatField(null=True, blank=True)
    longitude   = models.FloatField(null=True, blank=True)

    def __str__(self):
        return self.name

class Itinerary(models.Model):
    user        = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    attractions = models.ManyToManyField(Attraction, blank=True)

    def __str__(self):
        return f"{self.user.username}'s Itinerary"