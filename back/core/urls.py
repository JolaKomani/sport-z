from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Home app (pages)
    path("", include("apps.home.urls")),
    
    # Web pages (no prefix)
    path('matches/', include('apps.matches.web.urls')),
    path('teams/', include('apps.teams.web.urls')),
    path('users/', include('apps.users.web.urls')),
    path('squads/', include('apps.squads.web.urls')),
    path('ratings/', include('apps.ratings.web.urls')),
    
    # API endpoints (with /api/ prefix)
    path('api/matches/', include('apps.matches.api.urls')),
    path('api/teams/', include('apps.teams.api.urls')),
    path('api/users/', include('apps.users.api.urls')),
    path('api/squads/', include('apps.squads.api.urls')),
    path('api/ratings/', include('apps.ratings.api.urls')),
]
