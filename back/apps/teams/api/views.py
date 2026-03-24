import json

from django.http import HttpResponse
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from apps.teams.models import Team, User


@csrf_exempt
def team_list_api(request):

    teams = Team.objects.all()
    teams_list = []

    for team in teams:
        teams_list.append({
            'id': team.id,
            'name': team.name,
        })

    return JsonResponse({"teams": teams_list})


@csrf_exempt
def team_detail_api(request, pk):
    team = Team.objects.filter(pk=pk).first()
    if not team:
        return HttpResponse("teams not found", status=404)

    teams_data = {
        'id': team.id,
        'name': team.name,
        'admin': [user.full_name for user in team.admin.all()],
        'members': [user.full_name for user in team.members.all()],
    }

    return JsonResponse({"teams": teams_data})


@csrf_exempt
def team_create_api(request):
    data = json.loads(request.body)
    name = data.get('name')
    if not name:
        return HttpResponse("name is required")
    team = Team(name=name)
    team.save()
    return HttpResponse('Team Created')


@csrf_exempt
def team_update_api(request):
    data = json.loads(request.body)

    team_id = data.get('team_id')
    if not team_id:
        return HttpResponse("team id is required")

    team = Team.objects.filter(pk=team_id).first()
    if not team:
        return HttpResponse("team not found")

    name = data.get('name')
    admin = data.get('admin')
    members = data.get('members')

    if name:
        team.name = name
    if admin:
        users = User.objects.filter(id__in=admin)
        team.admin.set(users)
    if members:
        users = User.objects.filter(id__in=members)
        team.members.set(users)

    team.save()

    return HttpResponse('Team Updated Successfully')


@csrf_exempt
def team_delete_api(request):
    data = json.loads(request.body)
    team_id = data.get('team_id')
    if not team_id:
        return HttpResponse("team id is required")

    team = Team.objects.filter(pk=team_id).first()
    if not team:
        return HttpResponse("team not found")

    team.delete()

    return HttpResponse('Team Deleted Successfully')


@csrf_exempt
def team_matches_api(request, pk):
    team = Team.objects.filter(id=pk).first()
    if not team:
        return HttpResponse("Team not found", status=404)

    matches = team.matches.all()
    matches_list = []

    for match in matches:
        matches_list.append({
            'id': match.id,
            'location': match.location,
            'date': str(match.date),
            'time': str(match.time),
        })

    return JsonResponse({'matches': matches_list})


@csrf_exempt
def team_add_player_api(request):
    data = json.loads(request.body)

    team_id = data.get('team_id')
    user_id = data.get('user_id')

    if not all((team_id, user_id)):
        return HttpResponse("Team ID and User ID are required")

    team = Team.objects.filter(id=team_id).first()
    if not team:
        return HttpResponse("Team not found")

    user = User.objects.filter(id=user_id).first()
    if not user:
        return HttpResponse("User not found")

    team.members.add(user)
    team.save()

    return HttpResponse('Player Created')


@csrf_exempt
def team_remove_player_api(request):

    data = json.loads(request.body)

    team_id = data.get('team_id')
    user_id = data.get('user_id')

    if not all((team_id, user_id)):
        return HttpResponse("Team ID and User ID are required")

    team = Team.objects.filter(id=team_id).first()
    if not team:
        return HttpResponse("Team not found")

    user = User.objects.filter(id=user_id).first()
    if not user:
        return HttpResponse("User not found")

    team.members.remove(user)
    team.save()

    return HttpResponse('Player Removed')

