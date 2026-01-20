from django.db.models.signals import post_save
from django.dispatch import receiver
from tracker.models import Goal
from .services import generate_goal_insight
import threading

@receiver(post_save, sender=Goal)
def trigger_goal_insight(sender, instance, created, **kwargs):
    """
    Trigger AI analysis when a goal is marked as completed.
    Runs in a separate thread to avoid blocking the HTTP response.
    """
    if instance.is_completed and not created:
        # Check if insight already exists to avoid redundant calls
        if not hasattr(instance, 'ai_insight'):
            thread = threading.Thread(
                target=generate_goal_insight, 
                args=(instance.id, instance.user)
            )
            thread.start()