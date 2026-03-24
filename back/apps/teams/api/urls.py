from django.urls import path
from .views import (
    team_list_api,
    team_detail_api,
    team_create_api,
    team_update_api,
    team_delete_api,
    team_matches_api,
    team_add_player_api,
    team_remove_player_api,
)

app_name = "teams_api"

urlpatterns = [
    path('', team_list_api, name='list'),
    path('<int:pk>/', team_detail_api, name='detail'),
    path('create/', team_create_api, name='create'),
    path('update/', team_update_api, name='update'),
    path('delete/', team_delete_api, name='delete'),
    path('<int:pk>/matches/', team_matches_api, name='matches'),
    path('add-player/', team_add_player_api, name='add-player'),
    path('remove-player/', team_remove_player_api, name='remove-player'),
]

