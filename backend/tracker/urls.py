from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DashboardView, 
    LogHabitView, 
    LogGoalProgressView, 
    HabitViewSet, 
    GoalViewSet, 
    TaskViewSet
)

# Router for standard CRUD (Habit management, etc.)
router = DefaultRouter()
router.register(r'habits', HabitViewSet, basename='habit')
router.register(r'goals', GoalViewSet, basename='goal')
router.register(r'tasks', TaskViewSet, basename='task')

urlpatterns = [
    # A. The Dashboard (The "One Call" Endpoint)
    path('dashboard/<str:date_str>/', DashboardView.as_view(), name='dashboard'),

    # B. Quick Logging Actions (Optimized for "Log Anytime")
    path('log/habit/', LogHabitView.as_view(), name='log-habit'),
    path('log/goal/', LogGoalProgressView.as_view(), name='log-goal'),

    # C. Standard Management (CRUD)
    path('', include(router.urls)),
]