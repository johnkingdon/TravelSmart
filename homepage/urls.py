from django.urls import path
from . import views

urlpatterns = [
    path('', views.homepage, name='homepage'),
    path('announcements/', views.announcements_view, name='announcements'),
    path('announcements/dismiss/<int:announcement_id>/', views.dismiss_announcement, name='dismiss_announcement'),
]