import json
import os
from apps.users.models import User

def populate_users():

    dir_path = os.path.dirname(os.path.realpath(__file__))
    data_path = os.path.join(dir_path, 'data', 'users.json')

    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    users = []

    for u in data:
        user, created = User.objects.get_or_create(
            email=u["email"],
            defaults={
                "first_name": u["first_name"],
                "last_name": u["last_name"],
                "phone": u["phone"],
            }
        )

        if created and "password" in u:
            user.set_password(u["password"])
            user.save()

        users.append(user)

    print(f"Created {len(users)} users")
