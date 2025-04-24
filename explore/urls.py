from django.urls import path
from . import views

urlpatterns = [
    path('', views.explore, name='explore'),
    path('save-itinerary/', views.save_itinerary, name='save_itinerary'),  # <-- ADD THIS
]
