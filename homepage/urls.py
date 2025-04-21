from django.urls import path
from . import views

urlpatterns = [
    path('', views.homepage, name='homepage'),
    path('announcements/', views.announcements_view, name='announcements'),
    path('announcements/dismiss/<int:announcement_id>/', views.dismiss_announcement, name='dismiss_announcement'),
    path("explore/", views.explore, name="explore"),
    path("itinerary/add/",    views.add_to_itinerary,    name="add-to-itinerary"),
    path("itinerary/remove/", views.remove_from_itinerary, name="remove-from-itinerary"),
]