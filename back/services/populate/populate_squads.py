import json
import os

from apps.users.models import User
from apps.squads.models import Squad


def populate_squads():
    dir_path = os.path.dirname(os.path.realpath(__file__))
    data_path = os.path.join(dir_path, 'data', 'squads.json')

    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    squads = []

    for s in data:
        squad, created = Squad.objects.get_or_create(
            name=s["name"],
            defaults={"is_public": s["is_public"]}
        )

        squad.admins.clear()
        squad.members.clear()

        for email in s.get("admins", []):
            user = User.objects.filter(email=email).first()
            if user:
                squad.admins.add(user)

        for email in s.get("members", []):
            user = User.objects.filter(email=email).first()
            if user:
                squad.members.add(user)

        squad.save()
        squads.append(squad)

    print(f"Created {len(squads)} squads:")
    for sq in squads:
        print(
            f" - {sq.name} "
            f"(Admins: {[a.email for a in sq.admins.all()]}, "
            f"Members: {[m.email for m in sq.members.all()]})"
        )

    return squads
