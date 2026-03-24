from django.shortcuts import render
from django.contrib.auth.decorators import login_required


def user_create_view(request):
    return render(request, "users/create.html")


def user_login_view(request):
    return render(request, "users/login.html")


@login_required
def user_performance_view(request):
    return render(request, "users/performance.html")


@login_required
def user_profile_view(request):
    return render(request, "users/profile.html")
