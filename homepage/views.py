from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect
from .models import Announcement
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, get_object_or_404
from .models import Attraction, Itinerary
from django.http import JsonResponse
import json

def homepage(request):
    announcements = Announcement.objects.filter(is_active=True).order_by('-created_at')[:5]  # Show latest 5
    return render(request, 'homepage/home.html')


def announcements_view(request):
    if request.user.is_authenticated:
        announcements = Announcement.objects.filter(
            is_active=True
        ).exclude(seen_by=request.user).order_by('-created_at')
    else:
        announcements = Announcement.objects.filter(
            is_active=True
        ).order_by('-created_at')

    return render(request, 'homepage/announcements.html', {'announcements': announcements})

@login_required
def dismiss_announcement(request, announcement_id):
    if request.method == 'POST':
        announcement = get_object_or_404(Announcement, id=announcement_id)
        announcement.seen_by.add(request.user)
    return redirect('announcements')

@login_required
def explore(request):
    attractions   = Attraction.objects.all()
    itinerary, _  = Itinerary.objects.get_or_create(user=request.user)
    context       = {
        "attractions": attractions,
        "itinerary":   itinerary.attractions.all(),
    }
    return render(request, "explore/explore.html", context)

@login_required
def add_to_itinerary(request):
    data      = json.loads(request.body)
    attr_id   = data.get("id")
    itinerary = get_object_or_404(Itinerary, user=request.user)
    itinerary.attractions.add(attr_id)
    return JsonResponse({"status": "added"})

@login_required
def remove_from_itinerary(request):
    data      = json.loads(request.body)
    attr_id   = data.get("id")
    itinerary = get_object_or_404(Itinerary, user=request.user)
    itinerary.attractions.remove(attr_id)
    return JsonResponse({"status": "removed"})