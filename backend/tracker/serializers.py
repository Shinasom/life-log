from rest_framework import serializers
from .models import Habit, HabitLog, Goal, GoalProgress, Task, DailyLog

# --- LOGS (Child Serializers) ---

class HabitLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitLog
        fields = ['id', 'habit', 'date', 'status', 'entry_value', 'note', 'is_success']
        read_only_fields = ['id', 'is_success']

# 👇 Defined FIRST so GoalSerializer can use it
class GoalProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoalProgress
        fields = ['id', 'goal', 'date', 'moved_forward', 'note', 'created_at']

# --- ENTITIES (Parent Serializers) ---

class HabitSerializer(serializers.ModelSerializer):
    today_log = serializers.SerializerMethodField()
    
    # This fetches the name from the relation
    linked_goal_name = serializers.ReadOnlyField(source='linked_goal.name')

    class Meta:
        model = Habit
        fields = [
            'id', 
            'name', 
            'description', 
            'habit_type', 
            'frequency', 
            'tracking_mode', 
            'config', 
            'linked_goal', 
            'linked_goal_name', 
            'today_log'
        ]

    def get_today_log(self, obj):
        if hasattr(obj, 'today_log_instance'):
            log = obj.today_log_instance
            if log:
                return HabitLogSerializer(log).data
        return None

class GoalSerializer(serializers.ModelSerializer):
    today_progress = serializers.SerializerMethodField()
    
    # 👇 THIS IS THE MISSING PART THAT CAUSED YOUR ERROR
    logs = serializers.SerializerMethodField()

    class Meta:
        model = Goal
        fields = [
            'id', 'name', 'category', 'today_progress', 
            'is_active', 'is_completed', 'completed_at',
            'logs' # 👈 Now valid because 'logs' is defined above
        ]

    def get_today_progress(self, obj):
        if hasattr(obj, 'today_progress_instance'):
            log = obj.today_progress_instance
            if log:
                return GoalProgressSerializer(log).data
        return None

    # 👇 Logic to fetch the history
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

# --- THE AGGREGATOR (For the /today endpoint) ---

class DashboardSerializer(serializers.Serializer):
    date = serializers.DateField()
    daily_log = DailyLogSerializer(allow_null=True)
    habits = HabitSerializer(many=True)
    goals = GoalSerializer(many=True)
    tasks = TaskSerializer(many=True)