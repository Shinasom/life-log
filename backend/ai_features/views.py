from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services import generate_goal_insight

class GenerateGoalInsightView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, goal_id):
        # Call the service layer
        data = generate_goal_insight(goal_id, request.user)
        
        if "error" in data:
            return Response(data, status=400)
            
        return Response(data)