import json
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

from apps.squads.serializers import serialize_squad, serialize_squads
from apps.users.models import User
from apps.squads.models import Squad
from apps.squads.permissions import can_view_squad, can_modify_squad


@csrf_exempt
def squad_list_api(request):
    # List API: show user's squads and public squads
    user = request.user
    user_squads = Squad.objects.filter(admins=user)
    squads = {"user_squads": serialize_squads(user_squads)}

    # For authenticated users, also show squads they're members of
    if user.is_authenticated:
        member_squads = Squad.objects.filter(members=user).exclude(admins=user)
        if member_squads.exists():
            squads["member_squads"] = serialize_squads(member_squads)
        
        # Show public squads
        public_squads = Squad.objects.filter(is_public=True).exclude(admins=user).exclude(members=user)
        if public_squads.exists():
            squads["public_squads"] = serialize_squads(public_squads)
    else:
        # For unauthenticated users, only show public squads
        public_squads = Squad.objects.filter(is_public=True)
        if public_squads.exists():
            squads["public_squads"] = serialize_squads(public_squads)

    if user.is_superuser:
        other_squads = Squad.objects.exclude(admins=user).exclude(is_public=True)
        if other_squads.exists():
            squads["other_squads"] = serialize_squads(other_squads)

    return HttpResponse(json.dumps(squads), content_type="application/json")


@can_view_squad
def squad_detail_api(request, pk):
    squad = Squad.objects.filter(pk=pk).first()
    if not squad:
        return HttpResponse("Squad not found", status=404)

    squad_data = serialize_squad(squad)
    return HttpResponse(json.dumps(squad_data), content_type="application/json")


@csrf_exempt
def squad_create_api(request):
    # Creating a squad requires authentication
    if not request.user.is_authenticated:
        return HttpResponse("Authentication required", status=401)
    
    data = json.loads(request.body)
    name = data.get('name')
    members_emails = data.get('members_emails', [])
    is_public = data.get('is_public', False)

    if not name:
        return HttpResponse("Name is required", status=400)

    if Squad.objects.filter(name=name).exists():
        return HttpResponse("Squad already exists", status=400)

    squad = Squad(name=name, is_public=is_public)
    squad.save()

    squad.admins.add(request.user)

    users = User.objects.filter(email__in=members_emails)
    if users:
        squad.members.add(*users)

    squad_data = serialize_squad(squad)
    return HttpResponse(json.dumps(squad_data), content_type="application/json")


@can_modify_squad
def squad_update_api(request):
    data = json.loads(request.body)

    squad_id = data.get('squad_id')
    if not squad_id:
        return HttpResponse("Squad id is required", status=400)

    squad = Squad.objects.filter(id=squad_id).first()
    if not squad:
        return HttpResponse("Squad not found", status=404)

    name = data.get('name')
    players = data.get('players')
    is_public = data.get('is_public')

    if name:
        squad.name = name
    if players:
        users = User.objects.filter(email__in=players)
        squad.members.add(*users)
    if is_public is not None:
        squad.is_public = is_public

    squad.save()

    return HttpResponse("Squad updated successfully")


@can_modify_squad
def squad_delete_api(request):
    data = json.loads(request.body)

    squad_id = data.get('squad_id')
    if not squad_id:
        return HttpResponse("Squad id is required", status=400)

    squad = Squad.objects.filter(id=squad_id).first()
    if not squad:
        return HttpResponse("Squad not found", status=404)

    squad.delete()
    return HttpResponse("Squad deleted successfully")


@can_modify_squad
def squad_add_player_api(request):
    data = json.loads(request.body)

    squad_id = data.get('squad_id')
    user_id = data.get('user_id')

    if not all((squad_id, user_id)):
        return HttpResponse("squad_id, user_id are required", status=400)

    squad = Squad.objects.filter(id=squad_id).first()
    if not squad:
        return HttpResponse("Squad not found", status=404)

    user = User.objects.filter(id=user_id).first()
    if not user:
        return HttpResponse("User not found", status=404)

    squad.members.add(user)
    squad.save()

    return HttpResponse("Squad was added successfully")


@can_modify_squad
def squad_remove_player_api(request):
    data = json.loads(request.body)
    squad_id = data.get('squad_id')
    user_id = data.get('user_id')

    if not all((squad_id, user_id)):
        return HttpResponse("squad_id, user_id are required", status=400)

    squad = Squad.objects.filter(id=squad_id).first()
    if not squad:
        return HttpResponse("Squad not found", status=404)

    user = User.objects.filter(id=user_id).first()
    if not user:
        return HttpResponse("User not found", status=404)

    squad.members.remove(user)
    squad.save()

    return HttpResponse("Squad removed successfully")


@can_view_squad
def squad_players_api(request, pk):
    squad = Squad.objects.filter(pk=pk).first()
    if not squad:
        return HttpResponse("Squad not found", status=404)

    players_data = [{"id": p.id, "name": p.full_name} for p in squad.members.all()]
    return HttpResponse(json.dumps(players_data), content_type="application/json")
