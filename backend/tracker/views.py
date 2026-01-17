from django.db.models import Prefetch, Q
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

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
from .services import evaluate_windowed_habits # 👈 Logic for Auto-Fail

# ==========================================
# 1. THE DASHBOARD (READ CORE + LOGIC ENGINE)
# ==========================================

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, date_str):
        date = parse_date(date_str)
        if not date:
            return Response({"error": "Invalid date format"}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user

        # ---------------------------------------------------------
        # A. LAZY EVALUATION (The "Auto-Fail" Checker)
        # Only run if looking at Today/Yesterday to keep app fast
        # ---------------------------------------------------------
        if date >= (timezone.now().date() - timedelta(days=1)):
             evaluate_windowed_habits(user)

        # ---------------------------------------------------------
        # B. FETCH DATA
        # ---------------------------------------------------------
        
        # 1. Daily Log
        daily_log = DailyLog.objects.filter(user=user, date=date).first()

        # 2. Habits (Prefetch logs for efficiency)
        # We need ALL logs to calculate window progress, not just today's
        habits_qs = Habit.objects.filter(user=user, is_active=True).prefetch_related('logs')
        
        # 3. Goals
        # Prefetch today's progress for easy access
        goal_progress_prefetch = Prefetch(
            'progress_logs',
            queryset=GoalProgress.objects.filter(date=date),
            to_attr='today_progress_instance'
        )
        goals = Goal.objects.filter(user=user, is_active=True).prefetch_related(goal_progress_prefetch)

        # 4. Tasks (Pending OR Completed Today)
        tasks = Task.objects.filter(user=user).filter(
            Q(is_completed=False) | Q(completed_at__date=date)
        ).order_by('created_at')

        # ---------------------------------------------------------
        # C. SMART FILTERING LOGIC
        # ---------------------------------------------------------
        visible_habits = []
        
        for habit in habits_qs:
            # Attach Today's Log manually for the Serializer
            # (We scan the prefetched list instead of DB query)
            today_log = next((l for l in habit.logs.all() if l.date == date), None)
            habit.today_log_instance = today_log

            # --- FILTER 1: Weekly Habits ---
            if habit.frequency == 'WEEKLY':
                # Get Today's code: 'MON', 'TUE'...
                today_code = date.strftime('%a').upper()[:3] 
                required_days = habit.frequency_config.get('days', [])
                
                # If today is not in the schedule, HIDE IT
                if today_code not in required_days:
                    continue 

            # --- FILTER 2: Windowed Habits (N in M days) ---
            if habit.frequency == 'WINDOWED':
                target = int(habit.frequency_config.get('target', 1))
                period = int(habit.frequency_config.get('period', 7))
                
                start_date = habit.created_at.date()
                days_active = (date - start_date).days
                
                # Calculate Window Range
                if days_active >= 0:
                    current_window_idx = days_active // period
                    window_start = start_date + timedelta(days=current_window_idx * period)
                    window_end = window_start + timedelta(days=period - 1)

                    # Count SUCCESSFUL logs in this window
                    # (Note: We use the prefetched logs)
                    success_count = sum(
                        1 for l in habit.logs.all() 
                        if window_start <= l.date <= window_end and l.is_success
                    )

                    # RULE: Hide if Target Met, UNLESS the last action was Today
                    # (We want to see the checkmark if we just did it)
                    if success_count >= target:
                        did_it_today = (today_log and today_log.is_success)
                        if not did_it_today:
                            continue # Hide satisfied habit

            visible_habits.append(habit)

        # ---------------------------------------------------------
        # D. SERIALIZE & RETURN
        # ---------------------------------------------------------
        serializer = DashboardSerializer({
            "date": date,
            "daily_log": daily_log,
            "habits": visible_habits, # 👈 Using filtered list
            "goals": goals,
            "tasks": tasks
        })
        
        return Response(serializer.data)


# ==========================================
# 2. LOGGING ACTIONS (WRITE CORE)
# ==========================================

class LogHabitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        habit_id = request.data.get('habit_id')
        date_str = request.data.get('date')
        status_val = request.data.get('status')
        entry_value = request.data.get('entry_value')
        note = request.data.get('note')

        if not all([habit_id, date_str, status_val]):
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        habit = get_object_or_404(Habit, id=habit_id, user=request.user)
        
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

class HabitLogViewSet(viewsets.ModelViewSet):
    """
    Exposes Logs directly so we can DELETE them by ID.
    Used for 'Unmarking' a habit.
    """
    serializer_class = HabitLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return HabitLog.objects.filter(habit__user=self.request.user)