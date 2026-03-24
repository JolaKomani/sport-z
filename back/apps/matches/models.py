from django.db import models

from apps.teams.models import Team
from apps.squads.models import Squad

class Match(models.Model):
    location = models.CharField(max_length=120)
    datetime = models.DateTimeField()
    teams = models.ManyToManyField(Team, related_name='matches')
    squad = models.ForeignKey(
        Squad,
        on_delete=models.CASCADE,
        related_name='matches',
    )

    def __str__(self):
        return f"{self.location} - {self.datetime}"

    def delete(self, *args, **kwargs):
        self.teams.all().delete()
        super().delete(*args, **kwargs)
