from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DashboardView, 
    LogHabitView, 
    LogGoalProgressView, 
    HabitViewSet, 
    GoalViewSet, 
    TaskViewSet,
    HabitLogViewSet # <--- Import New ViewSet
)

router = DefaultRouter()
router.register(r'habits', HabitViewSet, basename='habit')
router.register(r'goals', GoalViewSet, basename='goal')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'logs', HabitLogViewSet, basename='habitlog') # <--- Register Route

urlpatterns = [
    path('dashboard/<str:date_str>/', DashboardView.as_view(), name='dashboard'),
    path('log/habit/', LogHabitView.as_view(), name='log-habit'),
    path('log/goal/', LogGoalProgressView.as_view(), name='log-goal'),
    path('', include(router.urls)),
]