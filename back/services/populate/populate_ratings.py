import json
import os

from apps.users.models import User
from apps.matches.models import Match
from apps.squads.models import Squad
from apps.ratings.models import Rating


def populate_ratings():
    dir_path = os.path.dirname(os.path.realpath(__file__))
    data_path = os.path.join(dir_path, 'data', 'ratings.json')

    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    ratings_created = []

    for r in data:
        match_name = r.get("match")
        rater_user = r.get("rater_user")
        rated_user = r.get("rated_user")
        score = r.get("score")

        squad = Squad.objects.filter(name=match_name).first()
        if not squad:
            print(f"Squad '{match_name}' not found, skipping rating.")
            continue


        match = Match.objects.filter(squad=squad).first()
        if not match:
            print(f"Match '{match_name}' not found, skipping rating.")
            continue

        rater = User.objects.filter(email=rater_user).first()
        rated = User.objects.filter(email=rated_user).first()

        if not rater or not rated:
            print(f"User '{rater_user}' not found, skipping rating.")
            continue

        rating, created = Rating.objects.get_or_create(
            match=match,
            rater_user=rater,
            rated_user=rated,
            defaults={"score": score}
        )
        ratings_created.append(rating)

    print(f"Created {len(ratings_created)} ratings.")
    return ratings_created
