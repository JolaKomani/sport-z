from services.populate.populate_matches import populate_matches
from services.populate.populate_ratings import populate_ratings
from services.populate.populate_squads import populate_squads
from services.populate.populate_users import populate_users


def populate():
    populate_users()
    populate_squads()
    populate_matches()
    populate_ratings()
