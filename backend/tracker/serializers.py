from rest_framework import serializers
from .models import Habit, HabitLog, Goal, GoalProgress, Task, DailyLog

# --- LOGS (Child Serializers) ---

class HabitLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitLog
        fields = ['id', 'habit', 'date', 'status', 'entry_value', 'note', 'is_success']
        read_only_fields = ['id', 'is_success']

class GoalProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoalProgress
        fields = ['id', 'goal', 'date', 'moved_forward', 'note']

# --- ENTITIES (Parent Serializers) ---

class HabitSerializer(serializers.ModelSerializer):
    # To include today's status in the list, we'll need context (passed from view)
    today_log = serializers.SerializerMethodField()

    class Meta:
        model = Habit
        fields = ['id', 'name', 'habit_type', 'frequency', 'tracking_mode', 'config', 'linked_goal', 'today_log']

    def get_today_log(self, obj):
        # We will prefetch this in the View to avoid N+1 queries
        # This looks for a specific attribute we'll annotate in the View
        if hasattr(obj, 'today_log_instance'):
            log = obj.today_log_instance
            if log:
                return HabitLogSerializer(log).data
        return None

class GoalSerializer(serializers.ModelSerializer):
    today_progress = serializers.SerializerMethodField()

    class Meta:
        model = Goal
        fields = ['id', 'name', 'category', 'today_progress']

    def get_today_progress(self, obj):
        if hasattr(obj, 'today_progress_instance'):
            log = obj.today_progress_instance
            if log:
                return GoalProgressSerializer(log).data
        return None

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'content', 'is_completed', 'completed_at']

class DailyLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyLog
        fields = ['id', 'date', 'mood_score', 'energy_level', 'note']

# --- THE AGGREGATOR (For the /today endpoint) ---

class DashboardSerializer(serializers.Serializer):
    date = serializers.DateField()
    daily_log = DailyLogSerializer(allow_null=True)
    habits = HabitSerializer(many=True)
    goals = GoalSerializer(many=True)
    tasks = TaskSerializer(many=True)