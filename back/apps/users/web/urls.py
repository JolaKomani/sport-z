from django.urls import path
from .views import user_create_view, user_login_view, user_performance_view, user_profile_view

app_name = "users_web"

urlpatterns = [
    path('create/', user_create_view, name='create'),
    path('login/', user_login_view, name='login'),
    path('performance/', user_performance_view, name='performance'),
    path('profile/', user_profile_view, name='profile'),
]
