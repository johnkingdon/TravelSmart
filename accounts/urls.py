from django.urls import path
from django.contrib.auth import views as auth_views
from . import views
from .views import CustomPasswordResetConfirmView, login_view

urlpatterns = [
    path('signup/', views.signup, name='accounts.signup'),
    path('login/', login_view, name='accounts.login'),
    path('logout/', views.logout, name='accounts.logout'),
    path('settings/', views.settings, name='accounts.settings'),

    path('login/reset_password/',
         auth_views.PasswordResetView.as_view(template_name='accounts/password_reset.html'),
         name='reset_password'),

    path('login/reset_password_sent/',
         auth_views.PasswordResetDoneView.as_view(template_name='accounts/password_reset_sent.html'),
         name='password_reset_done'),

    path('login/reset/<uidb64>/<token>/',
         # auth_views.PasswordResetConfirmView.as_view(template_name='accounts/password_reset_form.html'),
         CustomPasswordResetConfirmView.as_view(),
         name='password_reset_confirm'),

    path('login/reset_password_complete/',
         auth_views.PasswordResetCompleteView.as_view(template_name='accounts/password_reset_done.html'),
         name='password_reset_complete'),
]