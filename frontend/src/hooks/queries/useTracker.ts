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
export const useLogGoalProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { goal_id: string; date: string; moved_forward: boolean; note?: string }) => {
      const { data } = await api.post('/log/goal/', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

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