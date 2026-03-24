# Template views for squads app
from django.shortcuts import render


def squads_list_view(request):
    return render(request, "squads/list.html")


def squad_create_view(request):
    return render(request, "squads/create.html")


def squad_detail_view(request, pk):
    return render(request, "squads/detail.html")


def squad_update_view(request, pk):
    return render(request, "squads/edit.html")


def squad_matches_view(request, pk):
    return render(request, "matches/list.html")
