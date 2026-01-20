from rest_framework import serializers
from .models import Habit, HabitLog, Goal, GoalProgress, Task, DailyLog
from django.utils import timezone
from ai_features.models import GoalInsight 

# --- NEW SERIALIZER ---
class GoalInsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoalInsight
        fields = ['overview', 'patterns', 'reflection']

class HabitLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitLog
        fields = ['id', 'habit', 'date', 'status', 'entry_value', 'note', 'is_success']
        read_only_fields = ['id', 'is_success']

    def validate_date(self, value):
        if value > timezone.now().date():
            raise serializers.ValidationError("You cannot log habits for the future.")
        return value

class GoalProgressSerializer(serializers.ModelSerializer):
    # 👇 THIS LINE FIXES YOUR ERROR
    source_habit_name = serializers.ReadOnlyField(source='source_habit.name')

    class Meta:
        model = GoalProgress
        fields = [
            'id', 'goal', 'date', 'moved_forward', 'note', 'created_at', 
            'source_habit', 'source_habit_name'
        ]

class HabitSerializer(serializers.ModelSerializer):
    today_log = serializers.SerializerMethodField()
    linked_goal_name = serializers.ReadOnlyField(source='linked_goal.name')
    linked_goal_is_completed = serializers.ReadOnlyField(source='linked_goal.is_completed')

    class Meta:
        model = Habit
        fields = [
            'id', 
            'name', 
            'description', 
            'habit_type', 
            'frequency', 
            'frequency_config', 
            'tracking_mode', 
            'config', 
            'linked_goal', 
            'linked_goal_name', 
            # 👇 Keep this in the fields list
            'linked_goal_is_completed', 
            'today_log'
        ]

    def get_today_log(self, obj):
        if hasattr(obj, 'today_log_instance'):
            log = obj.today_log_instance
            if log:
                return HabitLogSerializer(log).data
        return None

class GoalSerializer(serializers.ModelSerializer):
    ai_insight = GoalInsightSerializer(read_only=True)
    logs = serializers.SerializerMethodField()

    class Meta:
        model = Goal
        fields = [
            'id', 'name', 'category', 'is_active', 
            'is_completed', 'completed_at', 'completion_note', 
            'logs', 'ai_insight'
        ]

    def get_logs(self, obj):
        logs = obj.progress_logs.all().order_by('-date', '-created_at')
        return GoalProgressSerializer(logs, many=True).data

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'content', 'is_completed', 'completed_at']

class DailyLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyLog
        fields = ['id', 'date', 'mood_score', 'energy_level', 'note']

class DashboardSerializer(serializers.Serializer):
    date = serializers.DateField()
    daily_log = DailyLogSerializer(allow_null=True)
    habits = HabitSerializer(many=True)
    goals = GoalSerializer(many=True)
    tasks = TaskSerializer(many=True)