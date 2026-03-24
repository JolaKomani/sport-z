from django.urls import path
from .views import squads_list_view, squad_create_view, squad_detail_view, squad_update_view, squad_matches_view

app_name = "squads_web"

urlpatterns = [
    path('', squads_list_view, name='list'),
    path('create/', squad_create_view, name='create'),
    path('<int:pk>/update/', squad_update_view, name='update'),
    path('<int:pk>/', squad_detail_view, name='detail'),
    path('<int:pk>/matches/', squad_matches_view, name='matches'),
]
