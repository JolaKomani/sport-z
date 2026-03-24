# Sport Zone

# Navigate to backend directory
```
cd back
```

# Create virtual environment
```
python -m venv .venv
```

# Activate virtual environment (Windows)
```
.\.venv\Scripts\activate
```

# Upgrade pip and install dependencies
```
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

# Apply database migrations
```
python manage.py migrate
```

# Populate database with sample data
```
python manage.py populate
```

# Run development server
```
python manage.py runserver
```

# Open in browser:
### http://127.0.0.1:8000/