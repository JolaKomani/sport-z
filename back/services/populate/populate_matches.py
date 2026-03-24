import json
import os
from datetime import datetime

from apps.matches.models import Match
from apps.squads.models import Squad
from apps.teams.models import Team
from apps.users.models import User


def populate_matches():
    dir_path = os.path.dirname(os.path.realpath(__file__))
    data_path = os.path.join(dir_path, 'data', 'matches.json')

    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    matches_created = []

    for squad_data in data:
        squad_name = squad_data.get("squad")
        squad = Squad.objects.get(name=squad_name)


        for m in squad_data["matches"]:
            match, created = Match.objects.get_or_create(
                location=m["location"],
                datetime=datetime.strptime(m["datetime"], "%Y-%m-%dT%H:%M:%S"),
                squad=squad,
            )

            for team_data in m["teams"]:
                team_name = team_data["name"]
                team_score = team_data["score"]
                team_players = team_data["players"]
                team = Team.objects.filter(name=team_name, matches=match).first()
                if not team:
                    team = Team.objects.create(name=team_name, score=team_score)
                    match.teams.add(team)
                    members = User.objects.filter(email__in=team_players)
                    team.members.add(*members)

            matches_created.append(match)

    print(f"Created {len(matches_created)} matches")
    return matches_created
