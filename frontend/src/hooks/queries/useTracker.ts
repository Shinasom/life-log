import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { DashboardData } from '@/types';
import { format } from 'date-fns';

// 1. Fetch Dashboard
export const useTodayData = (date: Date) => {
  const dateStr = format(date, 'yyyy-MM-dd'); 
  return useQuery({
    queryKey: ['dashboard', dateStr],
    queryFn: async () => {
      const { data } = await api.get<DashboardData>(`/dashboard/${dateStr}/`);
      return data;
    },
  });
};

// 2. Mark Habit as Done (Log it)
export const useLogHabit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { habit_id: string; date: string; status: string; note?: string }) => {
      const { data } = await api.post('/log/habit/', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// 3. Create New Habit (UPDATED for Frequency Engine)
export const useCreateHabit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      description?: string;
      habit_type: 'BUILD' | 'QUIT';
      frequency: 'DAILY' | 'WEEKLY' | 'WINDOWED';
      frequency_config?: any; // 👈 New JSON field
      tracking_mode: 'BINARY';
      config: Record<string, any>;
      linked_goal?: string;
    }) => {
      const { data } = await api.post('/habits/', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// 4. Delete Log (Unmark)
export const useDeleteHabitLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (logId: string) => {
      await api.delete(`/logs/${logId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// 5. Create Goal
export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; category: string }) => {
      const { data } = await api.post('/goals/', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
};

// 6. Log Goal Progress
export function useLogGoalProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: LogGoalProgressVars) => {
      // 🔴 WAS: const res = await api.post('/tracker/goal-progress/', data);
      // 🟢 FIX: Matches 'path("log/goal/", ...)' in backend/tracker/urls.py
      const res = await api.post('/log/goal/', data); 
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal', variables.goal_id] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

// 7. Fetch All Goals
export const useGoals = () => {
  return useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data } = await api.get('/goals/');
      return data;
    },
  });
};

// 8. Complete Goal
export const useCompleteGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; note?: string }) => {
      const { data } = await api.patch(`/goals/${payload.id}/`, {
        is_completed: true,
        completion_note: payload.note
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};


// 9. Fetch Single Goal
export const useGoal = (id: string) => {
  return useQuery({
    queryKey: ['goal', id],
    queryFn: async () => {
      const { data } = await api.get<Goal>(`/goals/${id}/`);
      return data;
    },
    enabled: !!id, // Only fetch if ID exists
  });
};


// ... inside useTracker.ts

// --- HABIT MUTATIONS ---

export const useEditHabit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const { data } = await api.patch(`/habits/${id}/`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteHabit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/habits/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// --- GOAL MUTATIONS ---

export const useEditGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const { data } = await api.patch(`/goals/${id}/`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal', data.id] });
    },
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/goals/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Add this to your existing hooks
export const useHabit = (id: string) => {
  return useQuery({
    queryKey: ['habit', id],
    queryFn: async () => {
      const { data } = await api.get<Habit>(`/habits/${id}/`);
      return data;
    },
    enabled: !!id,
  });
};

// Also ensure useHabits (plural) exists for the list page if you haven't already
export const useHabits = () => {
  return useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data } = await api.get<Habit[]>('/habits/');
      return data;
    },
  });
};

export const useDashboard = (date: string) => {
  return useQuery({
    queryKey: ['dashboard', date],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/${date}/`);
      return data;
    },
    enabled: !!date, // Only run if date is provided
  });
};
interface LogGoalProgressVars {
  goal_id: string;
  date: string;
  moved_forward: boolean;
  note?: string;
  habit_id?: string; // 👈 Add optional habit_id
}