from django.core.validators import MinValueValidator,MaxValueValidator
from django.db import models

from apps.users.models import User
from apps.matches.models import Match


class Rating(models.Model):
    match = models.ForeignKey(Match, on_delete=models.CASCADE)
    rater_user = models.ForeignKey(User, related_name='given_ratings', on_delete=models.CASCADE)
    rated_user = models.ForeignKey(User, related_name='received_ratings', on_delete=models.CASCADE)
    score = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)])

    class Meta:
        unique_together = ('match', 'rater_user', 'rated_user')

    def __str__(self):
        return f"{self.rater_user.first_name} rated {self.rated_user.first_name} - {self.score}"
