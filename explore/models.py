from django.db import models
from django.contrib.auth.models import User

class ItineraryLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    destination = models.CharField(max_length=255)
    category = models.CharField(max_length=50, blank=True, null=True)
    price_level = models.IntegerField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.destination} ({self.timestamp})"
