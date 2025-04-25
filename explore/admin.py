from django.contrib import admin
from .models import ItineraryDownloadLog

@admin.register(ItineraryDownloadLog)
class ItineraryDownloadLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'timestamp')
    verbose_name = "Itinerary Download Log"
    verbose_name_plural = "Itinerary Download Logs"