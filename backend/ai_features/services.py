import json
import os
from groq import Groq
from django.conf import settings
from tracker.models import Goal
from .models import GoalInsight

def build_context_data(goal: Goal):
    """
    Prepares the raw data from the goal for the AI.
    """
    data = {
        "goal": goal.name,
        "category": goal.category,
        "start_date": str(goal.created_at.date()),
        # Handle cases where completed_at might be missing
        "end_date": str(goal.completed_at.date()) if goal.completed_at else "Ongoing", 
        "habits_summary": [],
        "momentum_logs": []
    }

    # Summarize Linked Habits
    # 🔧 FIX: generic related_name is 'linked_habits' in your models.py
    for habit in goal.linked_habits.all(): 
        total_logs = habit.logs.count()
        successes = habit.logs.filter(status__in=['DONE', 'RESISTED']).count()
        
        # Calculate consistency rate
        rate = round((successes / max(1, total_logs)) * 100) if total_logs > 0 else 0
        
        data["habits_summary"].append({
            "name": habit.name,
            "frequency": habit.frequency,
            "consistency_rate": f"{rate}%",
            "total_logs": total_logs,
            "successes": successes
        })

    # Detailed Momentum Logs
    # We take the first 5 to see how they started, and the last 25 to see how they finished.
    all_logs = goal.progress_logs.all().order_by('date')
    
    if all_logs.count() > 30:
        # 🔧 FIX: .reverse() is list method, QuerySet uses .order_by('-date')
        last_25 = list(goal.progress_logs.all().order_by('-date')[:25])
        # Re-reverse specifically the last chunk to put them in chrono order
        selected_logs = list(all_logs[:5]) + last_25[::-1]
    else:
        selected_logs = list(all_logs)
    
    # Remove duplicates (in case total count is small and lists overlap)
    unique_logs = {log.id: log for log in selected_logs}.values()

    for log in unique_logs:
        data["momentum_logs"].append({
            "date": str(log.date),
            "moved_forward": log.moved_forward,
            "note": log.note or ""
        })

    return data

def generate_goal_insight(goal_id, user):
    """
    Orchestrator: Fetches goal, calls Groq AI, saves result.
    """
    try:
        goal = Goal.objects.get(id=goal_id, user=user)
    except Goal.DoesNotExist:
        return {"error": "Goal not found"}

    if not goal.is_completed:
        return {"error": "Goal must be completed to generate insights."}

    # 1. Check if insight already exists (Cache Check)
    if hasattr(goal, 'ai_insight'):
        return {
            "overview": goal.ai_insight.overview,
            "patterns": goal.ai_insight.patterns,
            "reflection": goal.ai_insight.reflection,
            "is_cached": True
        }

    # 2. Build Context Data
    context_data = build_context_data(goal)

    # 3. Call Groq AI
    client = Groq(api_key=settings.GROQ_API_KEY)
    
    system_prompt = """You generate goal insight summaries based on historical data. Your tone should be reflective, analytical, and human-readable. Focus on patterns, consistency, gaps, and how progress unfolded over time. Do not invent reasons not present in the data. Return strictly JSON."""

    user_prompt = f"""<context>
This system tracks long-term goals and daily habits.
**Habits** are repeatable actions (DAILY, WEEKLY).
**Momentum logs** record progress notes.
**Habit statuses**: DONE/RESISTED (Success), MISSED/FAILED (Failure).
</context>

<data>
{json.dumps(context_data, indent=2)}
</data>

Generate a JSON object with this EXACT structure:
{{
  "overview": "A 2-3 sentence summary of how progress unfolded",
  "patterns": ["Observation 1", "Observation 2", "Observation 3"],
  "optional_reflection": "A single high-level takeaway (or null)"
}}"""

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.6,
            max_tokens=1024,
            top_p=1,
            stream=False,
            response_format={"type": "json_object"}
        )

        # Parse Response
        response_content = completion.choices[0].message.content
        result = json.loads(response_content)

        # 4. Save to DB
        insight = GoalInsight.objects.create(
            goal=goal,
            overview=result.get('overview', 'Analysis generated.'),
            patterns=result.get('patterns', []),
            reflection=result.get('optional_reflection')
        )
        
        return {
            "overview": insight.overview,
            "patterns": insight.patterns,
            "reflection": insight.reflection
        }

    except Exception as e:
        print(f"Groq AI Error: {e}")
        return {"error": "Failed to generate insight. Please try again."}