def serialize_squad(squad):
    from apps.matches.models import Match
    match_count = Match.objects.filter(squad=squad).count()
    
    return {
        "id": squad.id,
        "name": squad.name,
        "is_public": squad.is_public,
        "players": [{"id": p.id, "name": p.full_name} for p in squad.members.all()],
        "admins": [{"id": a.id, "name": a.full_name} for a in squad.admins.all()],
        "match_count": match_count,
    }


def serialize_squads(squads):
   return [serialize_squad(s) for s in squads]
