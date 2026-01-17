from django.core.exceptions import ValidationError
from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid

class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

# --- GOALS & TASKS ---

class Goal(BaseModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="goals")
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self): return self.name

class Task(BaseModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tasks")
    content = models.CharField(max_length=255)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.is_completed and not self.completed_at:
            self.completed_at = timezone.now()
        elif not self.is_completed:
            self.completed_at = None
        super().save(*args, **kwargs)

    def __str__(self): return self.content

# --- HABITS ---

class Habit(BaseModel):
    TYPE_CHOICES = [('BUILD', 'Build'), ('QUIT', 'Quit')]
    FREQUENCY_CHOICES = [('DAILY', 'Daily'), ('WEEKLY', 'Weekly')]
    
    MODE_CHOICES = [
        ('BINARY', 'Yes/No'),       
        ('NUMERIC', 'Counter'),     
        ('CHECKLIST', 'Sub-items'), 
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="habits")
    name = models.CharField(max_length=255)
    habit_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='BUILD')
    frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES, default='DAILY')
    
    tracking_mode = models.CharField(max_length=10, choices=MODE_CHOICES, default='BINARY')
    config = models.JSONField(default=dict, blank=True)
    linked_goal = models.ForeignKey(Goal, on_delete=models.SET_NULL, null=True, blank=True, related_name="linked_habits")
    is_active = models.BooleanField(default=True)

    def clean(self):
        # Strict Rule: Quit habits must be binary
        if self.habit_type == 'QUIT' and self.tracking_mode != 'BINARY':
            raise ValidationError("Quit habits must use Binary (Yes/No) tracking.")
        super().clean()

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self): return self.name

class HabitLog(BaseModel):
    STATUS_CHOICES = [
        ('DONE', 'Done'), 
        ('MISSED', 'Missed'), 
        ('PARTIAL', 'Partial'),
        ('RESISTED', 'Resisted'), 
        ('FAILED', 'Failed')
    ]

    # ✅ CORRECTED: Removed 'user' field.
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name="logs")
    date = models.DateField(db_index=True)
    
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    entry_value = models.JSONField(null=True, blank=True)
    note = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        unique_together = ('habit', 'date')

    @property
    def is_success(self):
        return self.status in ['DONE', 'RESISTED']

    def clean(self):
        # Allow checking mode without crashing if habit is not yet linked (rare edge case)
        try:
            mode = self.habit.tracking_mode
        except Habit.DoesNotExist:
            return 

        val = self.entry_value
        
        if mode == 'NUMERIC':
            if val is not None and not isinstance(val, (int, float)):
                raise ValidationError({'entry_value': f"Numeric habits require a number, got {type(val)}"})
        
        elif mode == 'CHECKLIST':
            if val is not None and not isinstance(val, list):
                raise ValidationError({'entry_value': f"Checklist habits require a list, got {type(val)}"})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

# --- DAILY AGGREGATES ---

class DailyLog(BaseModel):
    # This keeps 'user' because it is a Root Entity
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="daily_logs")
    date = models.DateField(db_index=True)
    mood_score = models.IntegerField(null=True, blank=True)
    energy_level = models.IntegerField(null=True, blank=True)
    note = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('user', 'date')

class GoalProgress(BaseModel):
    # ✅ CORRECTED: Removed 'user' field.
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name="progress_logs")
    date = models.DateField(db_index=True)
    moved_forward = models.BooleanField(default=True)
    note = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        unique_together = ('goal', 'date')