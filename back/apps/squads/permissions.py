from functools import wraps
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from apps.squads.models import Squad


def can_view_squad(view_func):
    """
    Decorator to check if user can view a squad.
    - Public squads: anyone can view
    - Private squads: only admins and members can view
    """
    @wraps(view_func)
    @csrf_exempt
    def wrapper(request, *args, **kwargs):
        # Extract squad_id from kwargs or request
        squad_id = kwargs.get('pk') or kwargs.get('squad_id') or request.GET.get('squad_id')
        
        if squad_id:
            try:
                squad = Squad.objects.filter(id=squad_id).first()
                if not squad:
                    return HttpResponse("Squad not found", status=404)
                
                # Public squads: anyone can view
                if squad.is_public:
                    return view_func(request, *args, **kwargs)
                
                # Private squads: require authentication
                if not request.user.is_authenticated:
                    return HttpResponse("Authentication required", status=401)
                
                # Check if user is admin or member
                if request.user not in squad.admins.all() and request.user not in squad.members.all():
                    return HttpResponse("Access denied", status=403)
                
            except (ValueError, TypeError):
                return HttpResponse("Invalid squad ID", status=400)
        
        return view_func(request, *args, **kwargs)
    return wrapper


def can_modify_squad(view_func):
    """
    Decorator to check if user can modify a squad.
    - Only admins can modify (for both public and private squads)
    """
    @wraps(view_func)
    @csrf_exempt
    def wrapper(request, *args, **kwargs):
        # Require authentication
        if not request.user.is_authenticated:
            return HttpResponse("Authentication required", status=401)
        
        # Extract squad_id from request body or kwargs
        squad_id = kwargs.get('pk') or kwargs.get('squad_id')
        
        if not squad_id:
            # Try to get from request body
            try:
                import json
                data = json.loads(request.body)
                squad_id = data.get('squad_id')
            except:
                pass
        
        if squad_id:
            try:
                squad = Squad.objects.filter(id=squad_id).first()
                if not squad:
                    return HttpResponse("Squad not found", status=404)
                
                # Only admins can modify
                if request.user not in squad.admins.all():
                    return HttpResponse("Only squad admins can modify this squad", status=403)
                
            except (ValueError, TypeError):
                return HttpResponse("Invalid squad ID", status=400)
        
        return view_func(request, *args, **kwargs)
    return wrapper


def can_view_squad_matches(view_func):
    """
    Decorator to check if user can view matches of a squad.
    - Public squads: anyone can view matches
    - Private squads: only admins and members can view matches
    """
    @wraps(view_func)
    @csrf_exempt
    def wrapper(request, *args, **kwargs):
        squad_id = request.GET.get('squad_id') or kwargs.get('squad_id')
        
        if squad_id:
            try:
                squad = Squad.objects.filter(id=squad_id).first()
                if not squad:
                    return HttpResponse("Squad not found", status=404)
                
                # Public squads: anyone can view
                if squad.is_public:
                    return view_func(request, *args, **kwargs)
                
                # Private squads: require authentication
                if not request.user.is_authenticated:
                    return HttpResponse("Authentication required", status=401)
                
                # Check if user is admin or member
                if request.user not in squad.admins.all() and request.user not in squad.members.all():
                    return HttpResponse("Access denied", status=403)
                
            except (ValueError, TypeError):
                return HttpResponse("Invalid squad ID", status=400)
        
        return view_func(request, *args, **kwargs)
    return wrapper


def can_modify_squad_matches(view_func):
    """
    Decorator to check if user can modify matches of a squad.
    - Only admins can create/modify/delete matches
    """
    @wraps(view_func)
    @csrf_exempt
    def wrapper(request, *args, **kwargs):
        # Require authentication
        if not request.user.is_authenticated:
            return HttpResponse("Authentication required", status=401)
        
        # Extract squad_id from request body or kwargs
        squad_id = None
        
        # Try to get from request body (for create/update/delete operations)
        try:
            import json
            if hasattr(request, 'body') and request.body:
                data = json.loads(request.body)
                squad_id = data.get('squad_id')
                # For update/delete, also try to get match_id and find squad from match
                if not squad_id:
                    match_id = data.get('match_id')
                    if match_id:
                        from apps.matches.models import Match
                        match = Match.objects.filter(id=match_id).first()
                        if match and match.squad:
                            squad_id = match.squad.id
        except (json.JSONDecodeError, AttributeError):
            pass
        
        # Try to get from match if updating/deleting via URL parameter
        if not squad_id:
            match_id = kwargs.get('pk') or kwargs.get('match_id')
            if match_id:
                from apps.matches.models import Match
                match = Match.objects.filter(id=match_id).first()
                if match and match.squad:
                    squad_id = match.squad.id
        
        if squad_id:
            try:
                squad = Squad.objects.filter(id=squad_id).first()
                if not squad:
                    return HttpResponse("Squad not found", status=404)
                
                # Only admins can modify matches
                if request.user not in squad.admins.all():
                    return HttpResponse("Only squad admins can modify matches", status=403)
                
            except (ValueError, TypeError):
                return HttpResponse("Invalid squad ID", status=400)
        else:
            return HttpResponse("Squad ID is required", status=400)
        
        return view_func(request, *args, **kwargs)
    return wrapper
