from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .models import ItineraryLog

@login_required
def explore(request):
    return render(request, 'explore/explore.html', {
        'template_data': {'title': 'Explore'}
    })

@login_required
def save_itinerary(request):
    if request.method == 'POST':
        destination = request.POST.get('destination')
        category = request.POST.get('category')
        price_level = request.POST.get('price_filter')

        ItineraryLog.objects.create(
            user=request.user,
            destination=destination,
            category=category,
            price_level=int(price_level) if price_level else None
        )
        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)