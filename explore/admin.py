from django.contrib import admin
from .models import ItineraryLog

@admin.register(ItineraryLog)
class ItineraryLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'destination', 'category', 'price_level', 'timestamp')
    list_filter = ('category', 'price_level', 'timestamp')
    search_fields = ('destination', 'user__username')