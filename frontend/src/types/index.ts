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

export interface Goal {
  id: string;
  name: string;
  category: string;
  today_progress: GoalProgress | null;
  // 👇 Added these so Goals Page works
  is_active: boolean;
  is_completed: boolean;
  completed_at?: string;
  logs?: GoalProgress[]; // For the history timeline
}

export interface GoalProgress {
  id: string;
  goal: string;
  date: string; // ISO Date string
  moved_forward: boolean;
  note?: string;
  created_at?: string;
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