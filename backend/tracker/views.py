from rest_framework import viewsets, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date

from .models import Habit, HabitLog, Goal, GoalProgress, Task, DailyLog
from .serializers import (
    DashboardSerializer, 
    HabitSerializer, 
    GoalSerializer, 
    TaskSerializer, 
    DailyLogSerializer,
    HabitLogSerializer,
    GoalProgressSerializer
)

# ==========================================
# 1. THE DASHBOARD (READ CORE)
# ==========================================

class DashboardView(APIView):
    """
    Aggregates all daily context into a single efficient payload.
    Prevents the frontend from making 5+ API calls on load.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, date_str):
        date = parse_date(date_str)
        if not date:
            return Response({"error": "Invalid date format"}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user

        # A. Fetch Daily Log (Aggregator)
        daily_log = DailyLog.objects.filter(user=user, date=date).first()

        # B. Fetch Habits with "Smart Prefetching"
        # We only want the log for THIS specific date attached to the habit.
        # This prevents the 'N+1 query' problem.
        habit_logs_prefetch = Prefetch(
            'logs',
            queryset=HabitLog.objects.filter(date=date),
            to_attr='todays_logs_list' # Stores result in a temporary list attribute
        )
        
        habits = Habit.objects.filter(user=user, is_active=True).prefetch_related(habit_logs_prefetch)

        # Attach the single log instance manually for the Serializer to find
        for habit in habits:
            # logic: if list has item, take first, else None.
            habit.today_log_instance = habit.todays_logs_list[0] if habit.todays_logs_list else None

        # C. Fetch Goals with similar Prefetch logic
        goal_progress_prefetch = Prefetch(
            'progress_logs',
            queryset=GoalProgress.objects.filter(date=date),
            to_attr='todays_progress_list'
        )
        
        goals = Goal.objects.filter(user=user, is_active=True).prefetch_related(goal_progress_prefetch)
        
        for goal in goals:
            goal.today_progress_instance = goal.todays_progress_list[0] if goal.todays_progress_list else None

        # D. Fetch Tasks (Persistent Inbox)
        # We fetch all incomplete tasks OR tasks completed ON this specific date
        tasks = Task.objects.filter(user=user).filter(
            models.Q(is_completed=False) | models.Q(completed_at__date=date)
        ).order_by('created_at')

        # E. Serialize and Return
        data = {
            "date": date,
            "daily_log": daily_log,
            "habits": habits,
            "goals": goals,
            "tasks": tasks
        }
        
        serializer = DashboardSerializer(data)
        return Response(serializer.data)


# ==========================================
# 2. LOGGING ACTIONS (WRITE CORE)
# ==========================================

class LogHabitView(APIView):
    """
    Upsert logic: If a log exists for this day, update it. If not, create it.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        habit_id = request.data.get('habit_id')
        date_str = request.data.get('date')
        status_val = request.data.get('status')
        entry_value = request.data.get('entry_value')
        note = request.data.get('note')

        if not all([habit_id, date_str, status_val]):
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        # Security: Ensure user owns the habit
        habit = get_object_or_404(Habit, id=habit_id, user=request.user)
        
        # UPSERT (Update or Insert)
        log, created = HabitLog.objects.update_or_create(
            habit=habit,
            date=date_str,
            defaults={
                'status': status_val,
                'entry_value': entry_value,
                'note': note
            }
        )
        
        return Response(HabitLogSerializer(log).data, status=status.HTTP_200_OK)


class LogGoalProgressView(APIView):
    """
    Toggles the 'moved_forward' status or updates the note.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        goal_id = request.data.get('goal_id')
        date_str = request.data.get('date')
        moved_forward = request.data.get('moved_forward', True)
        note = request.data.get('note', '')

        goal = get_object_or_404(Goal, id=goal_id, user=request.user)

        log, created = GoalProgress.objects.update_or_create(
            goal=goal,
            date=date_str,
            defaults={
                'moved_forward': moved_forward,
                'note': note
            }
        )
        
        return Response(GoalProgressSerializer(log).data, status=status.HTTP_200_OK)


# ==========================================
# 3. ENTITY MANAGEMENT (CRUD)
# ==========================================

class HabitViewSet(viewsets.ModelViewSet):
    serializer_class = HabitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Habit.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class GoalViewSet(viewsets.ModelViewSet):
    serializer_class = GoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)