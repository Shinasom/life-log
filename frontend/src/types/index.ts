export interface Habit {
  id: string;
  name: string;
  description?: string;
  habit_type: 'BUILD' | 'QUIT';
  frequency: 'DAILY' | 'WEEKLY' | 'WINDOWED';
  frequency_config?: any; // { days: [] } or { target: 1, period: 7 }
  window_progress?: {     // 👈 Math from backend for Windowed habits
    current: number;
    target: number;
    days_remaining: number;
    is_satisfied: boolean;
  };
  tracking_mode: 'BINARY' | 'NUMERIC' | 'CHECKLIST';
  config?: any;
  linked_goal?: string;
  linked_goal_name?: string;
  is_active: boolean;
  linked_goal_is_completed?: boolean;
  logs?: HabitLog[];
  created_at: string;
  streak?: number;
  best_streak?: number;
  today_log?: {
    id: string;
    status: 'DONE' | 'MISSED' | 'FAILED' | 'PARTIAL' | 'RESISTED';
    entry_value?: any;
    note?: string;
  };
}

export interface HabitLog {
  id: string;
  habit: string;
  date: string;
  status: 'DONE' | 'MISSED' | 'PARTIAL' | 'RESISTED' | 'FAILED';
  entry_value: any;
  note?: string;
}

export interface GoalInsight {
  overview: string;
  patterns: string[];
  reflection: string | null;
}

export interface Goal {
  id: string;
  name: string;
  category: string;
  today_progress: GoalProgress | null;
  is_active: boolean;
  is_completed: boolean;
  completed_at?: string;
  completion_note?: string; // 👈 Make sure this is here too
  logs?: GoalProgress[];
  ai_insight?: GoalInsight;
  source_habit?: string | null;
  source_habit_name?: string | null; // 👈 The new field
  created_at?: string;
}

export interface GoalProgress {
  id: string;
  goal: string;
  date: string; 
  moved_forward: boolean;
  note?: string;
  created_at?: string;
  // ADD THIS LINE:
  source_habit?: string | null; 
   source_habit_name?: string | null;
}

export interface Task {
  id: string;
  content: string;
  is_completed: boolean;
  completed_at?: string;
}

export interface DailyLog {
  id: string;
  date: string;
  mood_score?: number;
  energy_level?: number;
  note?: string;
}

export interface DashboardData {
  date: string;
  daily_log: DailyLog | null;
  habits: Habit[];
  goals: Goal[];
  tasks: Task[];
}