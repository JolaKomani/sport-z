import json

from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Avg

from apps.matches.models import Match
from apps.users.models import User
from apps.ratings.models import Rating


@csrf_exempt
def rating_list_api(request, match_pk):
    """
    Get ratings for a specific match.
    If ?averages=true, returns average ratings per player (excluding self-ratings).
    Otherwise, returns all ratings for the match.
    """
    match = Match.objects.filter(id=match_pk).first()
    if not match:
        return HttpResponse("Match not found", status=404)
    
    # Check if requesting averages
    if request.GET.get('averages') == 'true':
        # Get average ratings per player (excluding self-ratings)
        all_match_players = []
        for team in match.teams.all():
            all_match_players.extend(team.members.all())
        
        averages = {}
        for player in all_match_players:
            # Get average rating excluding self-ratings
            avg_rating = Rating.objects.filter(
                match=match,
                rated_user=player
            ).exclude(
                rater_user=player
            ).aggregate(avg=Avg('score'))['avg']
            
            rating_count = Rating.objects.filter(
                match=match,
                rated_user=player
            ).exclude(
                rater_user=player
            ).count()
            
            averages[player.id] = {
                'player_id': player.id,
                'player_name': player.full_name,
                'average_rating': round(avg_rating, 2) if avg_rating else None,
                'rating_count': rating_count
            }
        
        return HttpResponse(json.dumps(averages), content_type="application/json")
    
    # Regular ratings list
    ratings = match.rating_set.all()
    ratings_list = []
    for rating in ratings:
        data = {
            'id': rating.id,
            'match_id': match.id,
            'rater_user': {
                'id': rating.rater_user.id,
                'name': rating.rater_user.full_name,
                'email': rating.rater_user.email
            },
            'rated_user': {
                'id': rating.rated_user.id,
                'name': rating.rated_user.full_name,
                'email': rating.rated_user.email
            },
            'rating': rating.score
        }
        ratings_list.append(data)
    return HttpResponse(json.dumps(ratings_list), content_type="application/json")


@csrf_exempt
def rating_detail_api(request, pk):
    rating = Rating.objects.filter(id=pk).first()
    if not rating:
        return JsonResponse({'error': 'Rating not found'}, status=404)

    rating_data = {
        'id': rating.id,
        'match': rating.match.id,
        'rater_user': rating.rater_user.full_name,
        'rated_user': rating.rated_user.full_name,
        'score': rating.score
    }

    return JsonResponse({'rating': rating_data})


@csrf_exempt
def rating_create_api(request):
    """
    Create a rating. If a rating already exists, it will be updated.
    Requires authentication and that the rater is a player in the match.
    """
    if not request.user.is_authenticated:
        return HttpResponse("Authentication required", status=401)
    
    data = json.loads(request.body)
    match_id = data.get('match_id')
    rated_user_id = data.get('rated_user_id')
    score = data.get('score')
    
    if not all([match_id, rated_user_id, score]):
        return HttpResponse("match_id, rated_user_id and score are required", status=400)
    
    try:
        score = int(score)
        if score < 1 or score > 10:
            return HttpResponse("Score must be between 1 and 10", status=400)
    except (ValueError, TypeError):
        return HttpResponse("Invalid score", status=400)
    
    match = Match.objects.filter(id=match_id).first()
    if not match:
        return HttpResponse("Match not found", status=404)
    
    # Check if rater and rated users are in the match
    all_match_players = []
    for team in match.teams.all():
        all_match_players.extend(team.members.all())
    
    if request.user not in all_match_players:
        return HttpResponse("You must be a player in this match to rate", status=403)
    
    rated_user = User.objects.filter(id=rated_user_id).first()
    if not rated_user:
        return HttpResponse("Rated user not found", status=404)
    
    if rated_user not in all_match_players:
        return HttpResponse("Rated user must be a player in this match", status=400)
    
    # Allow self-rating (but it won't be included in average calculations)
    
    # Get or create rating
    rating, created = Rating.objects.get_or_create(
        match=match,
        rater_user=request.user,
        rated_user=rated_user,
        defaults={'score': score}
    )
    
    if not created:
        rating.score = score
        rating.save()
    
    return HttpResponse(json.dumps({
        'id': rating.id,
        'match_id': match.id,
        'rater_user': {
            'id': rating.rater_user.id,
            'name': rating.rater_user.full_name,
            'email': rating.rater_user.email
        },
        'rated_user': {
            'id': rating.rated_user.id,
            'name': rating.rated_user.full_name,
            'email': rating.rated_user.email
        },
        'rating': rating.score
    }), content_type="application/json")


@csrf_exempt
def rating_update_api(request):
    """
    Update an existing rating. Requires authentication and that the rater owns the rating.
    """
    if not request.user.is_authenticated:
        return HttpResponse("Authentication required", status=401)
    
    data = json.loads(request.body)
    rating_id = data.get('rating_id')
    score = data.get('score')
    
    if not rating_id:
        return HttpResponse("rating_id is required", status=400)
    
    if score is None:
        return HttpResponse("score is required", status=400)
    
    try:
        score = int(score)
        if score < 1 or score > 10:
            return HttpResponse("Score must be between 1 and 10", status=400)
    except (ValueError, TypeError):
        return HttpResponse("Invalid score", status=400)
    
    rating = Rating.objects.filter(id=rating_id).first()
    if not rating:
        return HttpResponse("Rating not found", status=404)
    
    # Check that the current user is the rater
    if rating.rater_user.id != request.user.id:
        return HttpResponse("You can only update your own ratings", status=403)
    
    rating.score = score
    rating.save()
    
    return HttpResponse(json.dumps({
        'id': rating.id,
        'match_id': rating.match.id,
        'rater_user': {
            'id': rating.rater_user.id,
            'name': rating.rater_user.full_name,
            'email': rating.rater_user.email
        },
        'rated_user': {
            'id': rating.rated_user.id,
            'name': rating.rated_user.full_name,
            'email': rating.rated_user.email
        },
        'rating': rating.score
    }), content_type="application/json")


@csrf_exempt
def rating_delete_api(request):
    data = json.loads(request.body)
    rating_id = data.get('rating_id')

    if not rating_id:
        return HttpResponse("Rating is required", status=404)

    rating = Rating.objects.filter(id=rating_id).first()
    if not rating:
        return HttpResponse("Rating not found", status=404)

    rating.delete()
    return HttpResponse(f"Rating deleted successfully: {rating}")

