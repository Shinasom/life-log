from django.db import models
from tracker.models import Goal
import uuid

class GoalInsight(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    goal = models.OneToOneField(Goal, on_delete=models.CASCADE, related_name="ai_insight")
    
    overview = models.TextField()
    patterns = models.JSONField(default=list)
    reflection = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Insight for {self.goal.name}"