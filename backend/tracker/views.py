from django.db.models import Prefetch, Q
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, status
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
from .services import evaluate_windowed_habits
from ai_features.services import generate_goal_insight
from ai_features.models import GoalInsight
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

        # A. Lazy Eval
        if date >= (timezone.now().date() - timedelta(days=1)):
             evaluate_windowed_habits(user)

        # B. Fetch Data
        daily_log = DailyLog.objects.filter(user=user, date=date).first()
        habits_qs = Habit.objects.filter(user=user, is_active=True).prefetch_related('logs')
        
        goal_progress_prefetch = Prefetch(
            'progress_logs',
            queryset=GoalProgress.objects.filter(date=date),
            to_attr='today_progress_instance'
        )
        
        goals = Goal.objects.filter(
            user=user, 
            is_active=True, 
            is_completed=False 
        ).prefetch_related(goal_progress_prefetch)

        tasks = Task.objects.filter(user=user).filter(
            Q(is_completed=False) | Q(completed_at__date=date)
        ).order_by('created_at')

        # C. Filter Logic
        visible_habits = []
        for habit in habits_qs:
            today_log = next((l for l in habit.logs.all() if l.date == date), None)
            habit.today_log_instance = today_log

            if habit.frequency == 'WEEKLY':
                today_code = date.strftime('%a').upper()[:3] 
                required_days = habit.frequency_config.get('days', [])
                if today_code not in required_days:
                    continue 

            if habit.frequency == 'WINDOWED':
                target = int(habit.frequency_config.get('target', 1))
                period = int(habit.frequency_config.get('period', 7))
                start_date = habit.created_at.date()
                days_active = (date - start_date).days
                
                if days_active >= 0:
                    current_window_idx = days_active // period
                    window_start = start_date + timedelta(days=current_window_idx * period)
                    window_end = window_start + timedelta(days=period - 1)
                    success_count = sum(1 for l in habit.logs.all() if window_start <= l.date <= window_end and l.is_success)

                    if success_count >= target:
                        did_it_today = (today_log and today_log.is_success)
                        if not did_it_today:
                            continue

            visible_habits.append(habit)

        serializer = DashboardSerializer({
            "date": date,
            "daily_log": daily_log,
            "habits": visible_habits,
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
        
        # 1. Fetch habit_id
        habit_id = request.data.get('habit_id')

        goal = get_object_or_404(Goal, id=goal_id, user=request.user)

        if goal.is_completed:
             return Response({"error": "Goal is completed"}, status=400)

        # 2. Validate Habit
        source_habit = None
        if habit_id:
            source_habit = Habit.objects.filter(id=habit_id, user=request.user).first()

        # 3. Create Log with Habit Link
        log = GoalProgress.objects.create(
            goal=goal,
            date=date_str,
            moved_forward=moved_forward,
            note=note,
            source_habit=source_habit # 👈 This saves the link
        )
        
        return Response(GoalProgressSerializer(log).data, status=status.HTTP_200_OK)


# ==========================================
# 3. ENTITY MANAGEMENT (CRUD)
# ==========================================

class HabitViewSet(viewsets.ModelViewSet):
    serializer_class = HabitSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self): return Habit.objects.filter(user=self.request.user)
    def perform_create(self, serializer): serializer.save(user=self.request.user)

class GoalViewSet(viewsets.ModelViewSet):
    serializer_class = GoalSerializer
    queryset = Goal.objects.all()

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    # 👇 OVERRIDE THE RETRIEVE METHOD
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # --- AUTO-GENERATION LOGIC ---
        if instance.is_completed:
            # Check if insight exists safely using filter to avoid try/catch overhead
            insight_exists = GoalInsight.objects.filter(goal=instance).exists()
            
            if not insight_exists:
                print(f"Goal '{instance.name}' is completed but missing insight. Generating now...")
                try:
                    # Synchronously generate the insight so it appears in the response
                    generate_goal_insight(instance.id, request.user)
                    
                    # Refresh the instance from DB so it picks up the new relationship
                    instance.refresh_from_db()
                except Exception as e:
                    print(f"Error auto-generating insight: {e}")
                    # We continue even if AI fails, so the user at least gets the goal details
        # -----------------------------

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self): return Task.objects.filter(user=self.request.user)
    def perform_create(self, serializer): serializer.save(user=self.request.user)

class HabitLogViewSet(viewsets.ModelViewSet):
    serializer_class = HabitLogSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self): return HabitLog.objects.filter(habit__user=self.request.user)