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
