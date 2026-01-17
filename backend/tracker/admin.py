from django.contrib import admin
from .models import Goal, Task, Habit, HabitLog, DailyLog, GoalProgress

@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'category', 'is_active', 'is_completed', 'created_at')
    list_filter = ('is_active', 'is_completed', 'category')
    search_fields = ('name', 'user__username', 'category')
    date_hierarchy = 'created_at'

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('content', 'user', 'is_completed', 'completed_at', 'created_at')
    list_filter = ('is_completed', 'created_at')
    search_fields = ('content', 'user__username')
    date_hierarchy = 'created_at'

@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'habit_type', 'frequency', 'tracking_mode', 'is_active')
    list_filter = ('habit_type', 'frequency', 'tracking_mode', 'is_active')
    search_fields = ('name', 'user__username')

@admin.register(HabitLog)
class HabitLogAdmin(admin.ModelAdmin):
    list_display = ('habit', 'get_user', 'date', 'status', 'entry_value')
    list_filter = ('status', 'date')
    search_fields = ('habit__name', 'habit__user__username', 'note')
    date_hierarchy = 'date'

    # Helper to show user in the list view since HabitLog links to Habit, not User directly
    def get_user(self, obj):
        return obj.habit.user
    get_user.short_description = 'User'
    get_user.admin_order_field = 'habit__user'

@admin.register(GoalProgress)
class GoalProgressAdmin(admin.ModelAdmin):
    list_display = ('goal', 'date', 'moved_forward')
    list_filter = ('moved_forward', 'date')
    search_fields = ('goal__name', 'note')
    date_hierarchy = 'date'

@admin.register(DailyLog)
class DailyLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'mood_score', 'energy_level')
    list_filter = ('date', 'mood_score')
    search_fields = ('user__username', 'note')
    date_hierarchy = 'date'