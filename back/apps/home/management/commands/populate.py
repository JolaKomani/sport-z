from django.core.management.base import BaseCommand
from services.populate.populate import  populate

class Command(BaseCommand):
    help = 'Populate database with sample data'

    def handle(self, *args, **kwargs):
        populate()

        self.stdout.write(self.style.SUCCESS('Database populated successfully!'))