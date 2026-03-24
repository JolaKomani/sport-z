from apps.users.serializers import serialize_users


def serialize_matches(matches):
    matches_list = []
    for match in matches:
        # Format datetime as YYYY-MM-DDTHH:MM (naive format, no timezone)
        # This prevents timezone conversion issues
        datetime_str = match.datetime.strftime("%Y-%m-%dT%H:%M")
        matches_list.append({
            "id": match.id,
            "location": match.location,
            "datetime": datetime_str,
            "squad": {
                "id": match.squad.id,
                "name": match.squad.name,
                "admins": [{"id": a.id, "name": a.full_name} for a in match.squad.admins.all()],
            },
            "teams": [
                {
                    "id": team.id,
                    "name": team.name,
                    "score": team.score,
                } for team in match.teams.all()
            ],
        })

    return matches_list


def serialize_match(match):
    # Format datetime as YYYY-MM-DDTHH:MM (naive format, no timezone)
    # This prevents timezone conversion issues
    datetime_str = match.datetime.strftime("%Y-%m-%dT%H:%M")
    
    match_data = {
        "id": match.id,
        "location": match.location,
        "datetime": datetime_str,
        "squad": {
            "id": match.squad.id,
            "name": match.squad.name,
            "admins": [{"id": a.id, "name": a.full_name} for a in match.squad.admins.all()],
        },
        "players": serialize_users(match.squad.members.all()),
        "teams": [
            {
                "id": team.id,
                "name": team.name,
                "score": team.score,
                "members": serialize_users(team.members.all()),
            } for team in match.teams.all()
        ],
    }

    return match_data
