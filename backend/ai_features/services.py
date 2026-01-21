import json
import os
from groq import Groq
from django.conf import settings
from tracker.models import Goal, Habit
from .models import GoalInsight
from datetime import timedelta # <--- Make sure this is imported
from django.utils import timezone


# ==========================================
# 1. HABIT INSIGHTS (The "Observational" Engine)
# ==========================================

def build_habit_context(habit: Habit):
    """
    Prepares raw habit data for the AI, specifically looking for
    patterns between dates, statuses, and USER NOTES.
    """
    # 1. Get last 45 days (slightly longer window for better pattern matching)
    recent_logs = habit.logs.all().order_by('date') # Oldest to newest for trajectory
    
    # 2. Slice for context window if needed, but keep chronological order
    if recent_logs.count() > 45:
        recent_logs = recent_logs[recent_logs.count()-45:]

    return {
        "habit_name": habit.name,
        "frequency": habit.frequency,
        "logs": [
            {
                "date": log.date.strftime('%Y-%m-%d (%a)'), # Include Day of Week for AI
                "status": log.status,
                "value": log.entry_value,
                "note": log.note or "" # Crucial: AI needs to see "Why"
            } 
            for log in recent_logs
        ]
    }

def generate_habit_insight(habit_id, user):
    """
    Generates an analytical summary of habit performance, mirroring
    the style of Goal Insights.
    """
    try:
        habit = Habit.objects.get(id=habit_id, user=user)
    except Habit.DoesNotExist:
        return {"error": "Habit not found"}

    # 1. Build Context
    context_data = build_habit_context(habit)
    
    # 2. Configure AI
    client = Groq(api_key=settings.GROQ_API_KEY)
    
    # 👇 MATCHING THE GOAL INSIGHT STYLE
    system_prompt = """You generate analytical insights for daily habits based on historical logs. 
Your tone should be reflective, objective, and human-readable. 
Focus on:
1. Consistency patterns (e.g., "Strong start, but fading", "Specific weekdays are weak").
2. Contextual correlations (e.g., "Notes regarding 'fatigue' often precede a miss").
3. Trajectory (improving or declining).

Do not be a 'cheerleader'. Be an observer.
Return strictly JSON."""

    user_prompt = f"""<context>
The user is tracking a habit: "{context_data['habit_name']}" ({context_data['frequency']}).
Below are the recent logs. 
'DONE'/'RESISTED' = Success. 
'MISSED'/'FAILED' = Failure.
</context>

<data>
{json.dumps(context_data['logs'], indent=2)}
</data>

Generate a JSON object with this EXACT structure:
{{
  "overview": "A 2-3 sentence summary of the recent performance trajectory.",
  "patterns": [
    "Observation 1 (e.g., Day-of-week trend)", 
    "Observation 2 (e.g., Correlation with notes)", 
    "Observation 3"
  ],
  "recommendation": "A single, high-level strategic adjustment based on the data."
}}"""

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.5, # Lower temperature for more analytical output
            max_tokens=1024,
            response_format={"type": "json_object"}
        )

        response_content = completion.choices[0].message.content
        return json.loads(response_content)

    except Exception as e:
        print(f"Groq AI Error: {e}")
        return {"error": "Analysis failed."}

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
    


def generate_global_habit_insight(user):
    """
    Analyzes the INTERACTION between all active habits to find correlations.
    """
    # 1. Fetch Active Habits
    habits = Habit.objects.filter(user=user, is_active=True)
    if not habits.exists():
        return {"error": "No active habits to analyze."}

    # 2. Build the "Habit Matrix" (Last 30 Days)
    # Goal: [ {"date": "Mon", "Gym": "DONE", "Read": "MISSED"}, ... ]
    
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=30)
    
    # Prefetch logs to avoid N+1 queries
    habits = habits.prefetch_related('logs')
    
    matrix = []
    
    # Iterate through days
    for i in range(31):
        current_date = start_date + timedelta(days=i)
        day_str = current_date.strftime('%Y-%m-%d (%a)')
        
        day_data = {"date": day_str}
        has_data = False
        
        for habit in habits:
            # Find log for this day (in memory)
            log = next((l for l in habit.logs.all() if l.date == current_date), None)
            
            if log:
                day_data[habit.name] = log.status
                has_data = True
            else:
                # If it's a daily habit and no log, imply 'MISSED' (or 'N/A' for others)
                day_data[habit.name] = "NO_LOG"
        
        if has_data:
            matrix.append(day_data)

    # 3. AI Analysis
    client = Groq(api_key=settings.GROQ_API_KEY)
    
    system_prompt = """You are a Systems Analyst for human behavior. 
    Analyze the daily log matrix of multiple habits to find CORRELATIONS and SYSTEM FAILURES.
    
    Look for:
    1. The "Keystone Habit": Does one habit's success/failure predict the others? (e.g. "When Gym is DONE, Reading is always DONE").
    2. The "Domino Effect": Does missing one habit trigger a chain reaction?
    3. The "Weak Link": Is there a specific day of the week where the whole system collapses?
    
    Return strictly JSON."""

    user_prompt = f"""
    <data>
    {json.dumps(matrix, indent=2)}
    </data>

    Generate JSON:
    {{
      "system_health": "One sentence summary of the whole system's stability.",
      "correlations": ["Correlation 1", "Correlation 2"],
      "strategy": "One high-level change to improve the whole system."
    }}
    """

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.5,
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)

    except Exception as e:
        print(f"Global AI Error: {e}")
        return {"error": "System analysis failed."}