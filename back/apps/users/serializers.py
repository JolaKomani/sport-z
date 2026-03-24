def serialize_user(user):
    return {"id": user.id, "name": user.full_name}


def serialize_users(users):
    return [serialize_user(user)for user in users]
