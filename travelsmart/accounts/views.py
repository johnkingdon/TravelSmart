from django.shortcuts import render, redirect
from django.contrib.auth import login as auth_login, authenticate, logout as auth_logout
from django.contrib.auth.decorators import login_required
from .forms import CustomUserCreationForm, CustomErrorList, StyledAuthenticationForm

@login_required
def logout(request):
    auth_logout(request)
    return redirect('homepage')

def login(request):
    template_data = {}
    template_data['title'] = 'Login'

    if request.method == 'GET':
        form = StyledAuthenticationForm()
        template_data['form'] = form
        return render(request, 'accounts/login.html', {'template_data': template_data})

    elif request.method == 'POST':
        form = StyledAuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            auth_login(request, user)
            return redirect('homepage')
        else:
            template_data['form'] = form
            return render(request, 'accounts/login.html', {'template_data': template_data})

def signup(request):
    template_data = {'title': 'Sign Up'}
    if request.method == 'GET':
        template_data['form'] = CustomUserCreationForm()
        return render(request, 'accounts/signup.html', {'template_data': template_data})
    elif request.method == 'POST':
        form = CustomUserCreationForm(request.POST, error_class=CustomErrorList)
        if form.is_valid():
            form.save()
            return redirect('accounts.login')
        else:
            template_data['form'] = form
            return render(request, 'accounts/signup.html', {'template_data': template_data})
