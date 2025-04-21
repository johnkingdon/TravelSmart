from django.contrib import admin
from .models import Announcement
from .models import Attraction


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at', 'is_active')
    list_filter = ('is_active', 'created_at')
    search_fields = ('title', 'message')
    ordering = ('-created_at',)

    actions = ['delete_selected', 'hide_selected']

    @admin.action(description="Hide selected announcements")
    def hide_selected(self, request, queryset):
        queryset.update(is_active=False)

@admin.register(Attraction)
class AttractionAdmin(admin.ModelAdmin):
    list_display = ("name", "category")
    search_fields = ("name",)