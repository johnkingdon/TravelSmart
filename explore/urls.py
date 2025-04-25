from django.urls import path
from . import views

urlpatterns = [
    path('', views.explore, name='explore'),
    path('log-itinerary-download/', views.log_itinerary_download, name='log_itinerary_download'),
]
