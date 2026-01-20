import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Goal, Habit, DashboardData } from '@/types';
import { format } from 'date-fns';

// --- 1. DASHBOARD ---
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

// --- 2. HABIT QUERIES ---
export const useHabits = () => {
  return useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data } = await api.get<Habit[]>('/habits/');
      return data;
    },
  });
};

export const useHabit = (id: string | undefined) => {
  return useQuery({
    queryKey: ['habit', id],
    queryFn: async () => {
      const { data } = await api.get<Habit>(`/habits/${id}/`);
      return data;
    },
    enabled: !!id && id !== 'undefined',
    retry: false,
  });
};

// --- 3. HABIT MUTATIONS ---
export const useCreateHabit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      description?: string;
      habit_type: 'BUILD' | 'QUIT';
      frequency: 'DAILY' | 'WEEKLY' | 'WINDOWED';
      frequency_config?: any;
      tracking_mode: 'BINARY';
      config: Record<string, any>;
      linked_goal?: string;
    }) => {
      const { data } = await api.post('/habits/', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
};

export const useEditHabit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const { data } = await api.patch(`/habits/${id}/`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habit', data.id] });
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
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
};

// --- 4. HABIT LOGGING ---
export const useLogHabit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { 
      habit_id: string; 
      date: string; 
      status: string; 
      note?: string;
      value?: number;
    }) => {
      const { data } = await api.post('/log/habit/', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

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

// --- 5. GOAL QUERIES ---
export const useGoals = () => {
  return useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data } = await api.get<Goal[]>('/goals/');
      return data;
    },
  });
};

export const useGoal = (id: string | undefined) => {
  return useQuery({
    queryKey: ['goal', id],
    queryFn: async () => {
      const { data } = await api.get<Goal>(`/goals/${id}/`);
      return data;
    },
    enabled: !!id && id !== 'undefined',
    retry: false,
  });
};

// --- 6. GOAL MUTATIONS ---
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

export const useLogGoalProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { 
      goal_id: string; 
      date: string; 
      moved_forward: boolean; 
      note?: string;
      source_habit_id?: string;
    }) => {
      if (!data.goal_id || data.goal_id === 'undefined') {
        return Promise.reject("Invalid Goal ID");
      }
      const { goal_id, source_habit_id, ...payload } = data;
      const res = await api.post(`/goals/${goal_id}/log_progress/`, {
        ...payload,
        source_habit: source_habit_id
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goal', variables.goal_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

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