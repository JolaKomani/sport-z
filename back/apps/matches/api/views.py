import json

from datetime import datetime

from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

from apps.matches.serializers import serialize_matches, serialize_match
from apps.teams.models import Team
from apps.matches.models import Match
from apps.users.models import User
from apps.squads.models import Squad
from apps.squads.permissions import can_view_squad_matches, can_modify_squad_matches


@can_view_squad_matches
def match_list_api(request):
    squad_id = request.GET.get('squad_id')
    
    if not squad_id:
        return HttpResponse("squad_id parameter is required", status=400)
    
    try:
        squad_id = int(squad_id)
    except (ValueError, TypeError):
        return HttpResponse("Invalid squad_id parameter", status=400)
    
    squad = Squad.objects.filter(id=squad_id).first()
    if not squad:
        return HttpResponse("Squad not found", status=404)
    
    matches = Match.objects.filter(squad_id=squad_id).order_by('-datetime')
    matches_list = serialize_matches(matches)
    return HttpResponse(json.dumps(matches_list), content_type="application/json")


@csrf_exempt
def match_detail_api(request, pk):
    match = Match.objects.filter(id=pk).first()
    if not match:
        return HttpResponse("Match not found", status=404)
    
    # Check access: public squads or user is admin/member
    squad = match.squad
    if squad:
        user = request.user
        if not squad.is_public:
            if not user.is_authenticated:
                return HttpResponse("Authentication required", status=401)
            if user not in squad.admins.all() and user not in squad.members.all():
                return HttpResponse("Access denied", status=403)

    match_data = serialize_match(match)

    return HttpResponse(json.dumps(match_data), content_type="application/json")


@can_modify_squad_matches
def match_create_api(request):
    data = json.loads(request.body)

    location = data.get('location')
    datetime_str = data.get('datetime')
    teams = data.get('teams', [])
    squad_id = data.get('squad_id')

    if not all((location, datetime_str, teams, squad_id)):
        return HttpResponse("location, datetime, teams and squad_id are required")

    if len(teams) != 2:
        return HttpResponse("There should be exactly two teams", status=400)

    squad = Squad.objects.filter(id=squad_id).first()
    if not squad:
        return HttpResponse("squad not found")

    dt = datetime.strptime(datetime_str, "%Y-%m-%dT%H:%M")

    match = Match.objects.create(location=location, datetime=dt, squad=squad)

    used_player_ids = set()

    for team in teams:
        name = team.get('name')
        members = team.get('members_ids', [])
        score = team.get('score')

        for player_id in members:
            if player_id in used_player_ids:
                return HttpResponse("Same player cannot be in more than one team of the same match")

        used_player_ids.update(members)

        users = User.objects.filter(id__in=members)

        team_obj = Team.objects.create(name=name)
        if score is not None:
            team_obj.score = int(score)
            team_obj.save()
        team_obj.members.add(*users)
        match.teams.add(team_obj)

    return HttpResponse("Match created successfully")


@can_modify_squad_matches
def match_update_api(request):
    data = json.loads(request.body)

    match_id = data.get("match_id")
    if not match_id:
        return HttpResponse("match_id is required", status=400)

    match = Match.objects.filter(id=match_id).first()
    if not match:
        return HttpResponse("Match not found", status=404)

    location = data.get("location")
    datetime_str = data.get("datetime")

    if location:
        match.location = location
    if datetime_str:
        match.datetime = datetime.strptime(datetime_str, "%Y-%m-%dT%H:%M")

    match.save()

    teams = data.get("teams", [])

    for team_data in teams:
        team = Team.objects.get(id=team_data['id'])
        name = team_data.get('name')
        team.name = name
        score = team_data.get('score')
        if score is not None:
            team.score = int(score) if score != '' else None
        else:
            team.score = None
        team.save()
        players = team_data.get('player_ids', [])
        players = User.objects.filter(id__in=players)
        team.members.set(players)

    return HttpResponse(f"Match {match.id} updated successfully")


@can_modify_squad_matches
def match_delete_api(request):
    data = json.loads(request.body)
    match_id = data.get("match_id")

    if not match_id:
        return HttpResponse("match_id is required", status=400)

    match = Match.objects.filter(id=match_id).first()
    if not match:
        return HttpResponse("Match not found", status=404)

    match.delete()

    return HttpResponse("Match deleted successfully")


@csrf_exempt
def match_add_player_api(request):
    data = json.loads(request.body)

    match_id = data.get('match_id')
    user_id = data.get('user_id')

    if not all((match_id, user_id)):
        return HttpResponse("match_id, user_id are required", status=400)

    match = Match.objects.filter(id=match_id).first()
    if not match:
        return HttpResponse("Match not found", status=404)

    user = User.objects.filter(id=user_id).first()
    if not user:
        return HttpResponse("User not found", status=404)

    match.players.add(user)
    match.save()

    return HttpResponse("user created successfully")


@csrf_exempt
def match_remove_player_api(request):
    data = json.loads(request.body)

    match_id = data.get('match_id')
    user_id = data.get('user_id')

    if not all((match_id, user_id)):
        return HttpResponse("match_id, user_id are required", status=400)

    match = Match.objects.filter(id=match_id).first()
    if not match:
        return HttpResponse("Match not found", status=404)

    user = User.objects.filter(id=user_id).first()
    if not user:
        return HttpResponse("User not found", status=404)

    match.players.remove(user)
    match.save()

    return HttpResponse("user removed successfully")


