from django.shortcuts import render


def match_create_view(request):
    return render(request, "matches/create.html")


def match_detail_view(request, pk):
    return render(request, "matches/detail.html")


def match_update_view(request, pk):
    return render(request, "matches/edit.html")