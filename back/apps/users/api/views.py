import json

from django.db.models import Avg
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout

from apps.users.models import User


@csrf_exempt
def user_list_api(request):
    users = User.objects.all()

    users_list = list(users.values("id", "first_name", "last_name", "email", "phone"))

    return HttpResponse(json.dumps(users_list), content_type="application/json")


@csrf_exempt
def user_detail_api(request, pk):
    user = User.objects.filter(pk=pk).first()
    if not user:
        return HttpResponse("user not found", status=404)

    user_data = {
        'id': user.id,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
        'phone': user.phone,
    }

    return HttpResponse(json.dumps(user_data), content_type="application/json")


@csrf_exempt
def user_create_api(request):
    data = json.loads(request.body)

    first_name = data.get('first_name')
    last_name = data.get('last_name')
    email = data.get('email')
    phone = data.get('phone')
    password = data.get('password')

    if not all((first_name, last_name, email, password)):
        return HttpResponse('first_name, last_name, email and password are required')

    if User.objects.filter(email=email).exists():
        return HttpResponse('User with this email exists')

    user = User(email=email, first_name=first_name, last_name=last_name, phone=phone)
    user.set_password(password)
    user.save()

    login(request, user)

    return HttpResponse('User created successfully')


@csrf_exempt
def user_update_api(request):
    """Update user profile. Requires authentication and user can only update their own profile."""
    if not request.user.is_authenticated:
        return HttpResponse('Authentication required', status=401)
    
    data = json.loads(request.body)

    user_id = data.get('user_id')
    if not user_id:
        return HttpResponse('user_id is required', status=400)

    user = User.objects.filter(pk=user_id).first()
    if not user:
        return HttpResponse('user not found', status=404)
    
    # Ensure user can only update their own profile
    if request.user.id != user.id:
        return HttpResponse('You can only update your own profile', status=403)

    first_name = data.get('first_name')
    last_name = data.get('last_name')
    email = data.get('email')
    phone = data.get('phone')
    password = data.get('password')

    if first_name:
        user.first_name = first_name
    if last_name:
        user.last_name = last_name
    if email:
        # Check if email is already taken by another user
        if User.objects.filter(email=email).exclude(id=user.id).exists():
            return HttpResponse('Email already exists', status=400)
        user.email = email
    if phone:
        user.phone = phone
    if password:
        # Update password
        user.set_password(password)
        user.save()
        return HttpResponse('User updated successfully')
    
    user.save()
    return HttpResponse('User updated successfully')


@csrf_exempt
def user_delete_api(request):
    data = json.loads(request.body)
    user_id = data.get('user_id')
    if not user_id:
        return HttpResponse('user_id is required')
    user = User.objects.filter(pk=user_id).first()
    if not user:
        return HttpResponse('user not found')
    user.delete()
    return HttpResponse('User deleted successfully')


@csrf_exempt
def user_login_api(request):
    """Login API - uses Django's authenticate() and login()"""
    data = json.loads(request.body)
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return HttpResponse('email and password are required', status=400)

    # Use Django's authenticate() - pass email as 'username' since USERNAME_FIELD='email'
    user = authenticate(request, username=email, password=password)
    
    if user is None:
        return HttpResponse('Invalid email or password', status=401)

    login(request, user)

    return JsonResponse({
        'message': 'Login successful',
        'user': {
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email
        }
    })


@csrf_exempt
def user_logout_api(request):
    """Logout API - uses Django's logout()"""
    logout(request)
    return HttpResponse('Logged out successfully')


@csrf_exempt
def user_me_api(request):
    """Get current logged in user via request.user"""
    if not request.user.is_authenticated:
        return HttpResponse('Not authenticated', status=401)
    
    user = request.user
    return JsonResponse({
        'id': user.id,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
        'phone': user.phone,
        'full_name': user.full_name
    })


@csrf_exempt
def user_avg_rating_api(request):
    data = json.loads(request.body)

    player_id = data.get('player_id')

    if not player_id:
        return HttpResponse("player_id is required", status=400)

    player = User.objects.filter(id=player_id).first()
    if not player:
        return HttpResponse("User not found", status=404)

    ratings = player.received_ratings.all()

    if not ratings.exists():
        return HttpResponse("This player has no ratings yet", status=404)

    avg_rating = ratings.aggregate(Avg('score'))['score__avg']

    return HttpResponse(avg_rating)


@csrf_exempt
def players_avg_ratings_api(request):
    """Get average ratings (by others, excluding self-ratings) for multiple players.
    If squad_id is provided, only include ratings from matches in that squad."""
    from apps.ratings.models import Rating
    from apps.matches.models import Match
    
    if request.method == 'GET':
        player_ids = request.GET.get('player_ids', '')
        squad_id = request.GET.get('squad_id')
        
        if not player_ids:
            return HttpResponse("player_ids parameter is required", status=400)
        
        try:
            player_id_list = [int(id.strip()) for id in player_ids.split(',') if id.strip()]
        except ValueError:
            return HttpResponse("Invalid player_ids format", status=400)
        
        if not player_id_list:
            return HttpResponse("No valid player IDs provided", status=400)
        
        # Get matches for the squad if squad_id is provided
        squad_matches = None
        if squad_id:
            try:
                squad_id_int = int(squad_id)
                from apps.squads.models import Squad
                squad = Squad.objects.filter(id=squad_id_int).first()
                if squad:
                    squad_matches = Match.objects.filter(squad=squad)
            except (ValueError, TypeError):
                return HttpResponse("Invalid squad_id format", status=400)
        
        players = User.objects.filter(id__in=player_id_list)
        ratings_data = {}
        
        for player in players:
            # Base query for ratings by others (excluding self-ratings)
            ratings_query = Rating.objects.filter(
                rated_user=player
            ).exclude(
                rater_user=player
            )
            
            # Filter by squad matches if squad_id is provided
            if squad_matches is not None:
                ratings_query = ratings_query.filter(match__in=squad_matches)
            
            # Get average rating
            avg_rating = ratings_query.aggregate(avg=Avg('score'))['avg']
            
            # Get rating count
            rating_count = ratings_query.count()
            
            ratings_data[player.id] = {
                'player_id': player.id,
                'average_rating': round(avg_rating, 2) if avg_rating else None,
                'rating_count': rating_count
            }
        
        return JsonResponse(ratings_data)
    
    return HttpResponse("Method not allowed", status=405)


@csrf_exempt
def user_performance_api(request):
    """Get performance statistics for the logged-in user"""
    if not request.user.is_authenticated:
        return HttpResponse("Authentication required", status=401)
    
    from apps.matches.models import Match
    from apps.ratings.models import Rating
    from apps.teams.models import Team
    from django.db.models import Avg, Q
    
    user = request.user
    
    # Get all matches where user played (user is in a team that's in a match)
    user_teams = Team.objects.filter(members=user)
    matches = Match.objects.filter(teams__in=user_teams).distinct().order_by('datetime')
    
    # Calculate statistics
    # Only count matches where all teams have scores filled
    total_matches = 0
    wins = 0
    losses = 0
    draws = 0
    match_data = []
    
    for match in matches:
        # Get the team the user was in for this match
        user_team = match.teams.filter(members=user).first()
        if not user_team:
            continue
        
        user_team_score = user_team.score if user_team.score is not None else None
        
        # Skip matches where user's team has no score
        if user_team_score is None:
            continue
        
        # Check if all other teams have scores
        other_teams = match.teams.exclude(id=user_team.id)
        all_teams_have_scores = True
        other_team_scores = []
        
        for other_team in other_teams:
            other_score = other_team.score if other_team.score is not None else None
            if other_score is None:
                all_teams_have_scores = False
                break
            other_team_scores.append(other_score)
        
        # Only count matches where all teams have scores
        if not all_teams_have_scores:
            continue
        
        total_matches += 1
        
        # Determine result: win, loss, or draw
        max_other_score = max(other_team_scores) if other_team_scores else -1
        won = False
        lost = False
        draw = False
        
        if user_team_score > max_other_score:
            # User's team has the highest score - win
            won = True
            wins += 1
        elif user_team_score < max_other_score:
            # User's team score is less than at least one other team - loss
            lost = True
            losses += 1
        else:
            # User's team score equals the highest other score - draw
            draw = True
            draws += 1
        
        # Get average rating by others for this match (excluding self-ratings)
        avg_rating_by_others = Rating.objects.filter(
            match=match,
            rated_user=user
        ).exclude(
            rater_user=user
        ).aggregate(avg=Avg('score'))['avg']
        
        # Get self-rating for this match
        self_rating = Rating.objects.filter(
            match=match,
            rater_user=user,
            rated_user=user
        ).first()
        
        match_data.append({
            'match_id': match.id,
            'date': match.datetime.strftime("%Y-%m-%d"),
            'datetime': match.datetime.strftime("%Y-%m-%dT%H:%M"),
            'location': match.location,
            'won': won,
            'lost': lost,
            'draw': draw,
            'user_team_score': user_team_score,
            'average_rating_by_others': round(avg_rating_by_others, 2) if avg_rating_by_others else None,
            'self_rating': self_rating.score if self_rating else None,
        })
    
    # Calculate overall average rating by others (excluding self-ratings)
    all_ratings_by_others = Rating.objects.filter(
        rated_user=user
    ).exclude(
        rater_user=user
    )
    overall_avg_rating = all_ratings_by_others.aggregate(avg=Avg('score'))['avg']
    
    # Calculate overall self-rating average
    self_ratings = Rating.objects.filter(
        rater_user=user,
        rated_user=user
    )
    overall_avg_self_rating = self_ratings.aggregate(avg=Avg('score'))['avg']
    
    performance_data = {
        'total_matches': total_matches,
        'wins': wins,
        'losses': losses,
        'draws': draws,
        'overall_avg_rating_by_others': round(overall_avg_rating, 2) if overall_avg_rating else None,
        'overall_avg_self_rating': round(overall_avg_self_rating, 2) if overall_avg_self_rating else None,
        'matches': match_data
    }
    
    return JsonResponse(performance_data)