from django.urls import path
from .views import GenerateGoalInsightView

urlpatterns = [
    path('goals/<int:goal_id>/insight/', GenerateGoalInsightView.as_view()),
]