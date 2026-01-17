# backend/tracker/services.py

from datetime import timedelta
from django.utils import timezone
from .models import Habit, HabitLog

def evaluate_windowed_habits(user):
    """
    Checks all active WINDOWED habits for this user.
    If a window has passed and the target wasn't met, auto-log FAILED.
    """
    today = timezone.now().date()
    habits = Habit.objects.filter(
        user=user, 
        is_active=True, 
        frequency='WINDOWED'
    )

    for habit in habits:
        target = int(habit.frequency_config.get('target', 1))
        period = int(habit.frequency_config.get('period', 7))
        
        # Calculate the CURRENT window start based on creation date
        # (Simplified logic: Windows start from created_at)
        start_date = habit.created_at.date()
        days_active = (today - start_date).days
        
        # We check previous completed windows
        # e.g., if active for 15 days and period is 7:
        # Check Window 1 (Day 0-6) and Window 2 (Day 7-13)
        # Window 3 (Day 14-20) is still current, so don't fail it yet.
        
        completed_windows = days_active // period
        
        for i in range(completed_windows):
            window_start = start_date + timedelta(days=i*period)
            window_end = window_start + timedelta(days=period - 1)
            
            # 1. Check if we already marked this window as FAILED
            # We look for a failure log specifically on the last day of that window
            already_failed = HabitLog.objects.filter(
                habit=habit,
                date=window_end,
                status='FAILED'
            ).exists()
            
            if already_failed:
                continue

            # 2. Count successes in this window
            success_count = HabitLog.objects.filter(
                habit=habit,
                date__range=[window_start, window_end],
                status__in=['DONE', 'RESISTED']
            ).count()

            # 3. If target unmet, MARK FAILED
            if success_count < target:
                HabitLog.objects.create(
                    habit=habit,
                    date=window_end, # 👈 Fail on the last day of window
                    status='FAILED',
                    note=f"Window expired. Completed {success_count}/{target}."
                )