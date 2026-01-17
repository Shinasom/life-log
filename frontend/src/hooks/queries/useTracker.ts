import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { DashboardData } from '@/types';
import { format } from 'date-fns';
// 1. Fetch Dashboard
export const useTodayData = (date: Date) => {
  // Format date to YYYY-MM-DD
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
    mutationFn: async (payload: { habit_id: string; date: string; status: string }) => {
      const { data } = await api.post('/log/habit/', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// 3. Create New Habit
export const useCreateHabit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      habit_type: 'BUILD' | 'QUIT';
      frequency: 'DAILY' | 'WEEKLY';
      tracking_mode: 'BINARY';
      config: Record<string, any>;
    }) => {
      const { data } = await api.post('/habits/', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// 4. Delete Log (Unmark) - 👈 THIS WAS MISSING
export const useDeleteHabitLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (logId: string) => {
      // Calls DELETE /api/v1/logs/{id}/
      await api.delete(`/logs/${logId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};