from django.db import models
from apps.users.models import User


class Team(models.Model):
    name = models.CharField(max_length=50)
    members = models.ManyToManyField(User, related_name='teams')
    score = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return self.name
