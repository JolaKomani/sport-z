from django.db import models
from apps.users.models import User


class Squad(models.Model):
    name = models.CharField(max_length=120)
    is_public = models.BooleanField(default=False)
    admins = models.ManyToManyField(User, related_name='created_squads')
    members = models.ManyToManyField(User, related_name='squads')

    def __str__(self):
        return self.name
