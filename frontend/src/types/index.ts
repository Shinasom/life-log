export interface Habit {
  id: string;
  name: string;
  habit_type: 'BUILD' | 'QUIT';
  frequency: 'DAILY' | 'WEEKLY';
  tracking_mode: 'BINARY' | 'NUMERIC' | 'CHECKLIST';
  config: Record<string, any>;
  today_log: HabitLog | null; 
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
}

export interface GoalProgress {
  id: string;
  goal: string;
  moved_forward: boolean;
  note?: string;
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