from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .models import ItineraryDownloadLog
from django.views.decorators.csrf import csrf_exempt

@login_required
def explore(request):
    return render(request, 'explore/explore.html', {
        'template_data': {'title': 'Explore'}
    })

@login_required
@csrf_exempt
def log_itinerary_download(request):
    if request.method == 'POST':
        ItineraryDownloadLog.objects.create(user=request.user)
        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)