'use client';

import { useUIStore } from '@/hooks/stores/useUIStore';
import { useTodayData, useLogHabit, useDeleteHabitLog } from '@/hooks/queries/useTracker'; // 👈 Added delete hook
import { format, addDays } from 'date-fns';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TodayPage() {
  const { selectedDate, setSelectedDate } = useUIStore();
  
  // 1. Fetch Data
  const { data, isLoading, isError } = useTodayData(selectedDate);
  
  // 2. mutations
  const logHabit = useLogHabit();
  const deleteLog = useDeleteHabitLog(); // 👈 Initialize Delete Hook

  // Date Navigation Helper
  const changeDate = (days: number) => {
    setSelectedDate(addDays(selectedDate, days));
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isError) {
    return <div className="p-4 text-red-500">Failed to load data. Is the backend running?</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      
      {/* DATE HEADER */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border">
        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">←</button>
        <div className="text-center">
          <h2 className="font-semibold text-lg">{format(selectedDate, 'EEEE')}</h2>
          <p className="text-sm text-gray-500">{format(selectedDate, 'MMMM d, yyyy')}</p>
        </div>
        <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 rounded-lg">→</button>
      </div>

      {/* HABITS SECTION */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Habits</h3>
        <div className="space-y-3">
          {data?.habits.length === 0 && (
            <div className="text-center py-8 text-gray-400">No habits active today.</div>
          )}
          
          {data?.habits.map((habit) => {
            const isDone = habit.today_log?.status === 'DONE';
            const logId = habit.today_log?.id; // 👈 We need this ID to delete it

            // The Logic: If done, delete. If not done, create.
            const handleToggle = () => {
              if (isDone && logId) {
                deleteLog.mutate(logId);
              } else {
                logHabit.mutate({
                  habit_id: habit.id,
                  date: format(selectedDate, 'yyyy-MM-dd'),
                  status: 'DONE'
                });
              }
            };
            
            // Check if THIS specific button is loading
            const isProcessing = 
              (logHabit.isPending && logHabit.variables?.habit_id === habit.id) ||
              (deleteLog.isPending && deleteLog.variables === logId);

            return (
              <div 
                key={habit.id} 
                className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm transition-all hover:shadow-md"
              >
                <div>
                  <h4 className={`font-medium ${isDone ? 'text-gray-500 line-through' : 'text-black'}`}>
                    {habit.name}
                  </h4>
                  <p className="text-xs text-gray-400">{habit.habit_type} • {habit.frequency}</p>
                </div>

                <div className="flex gap-2">
                  <button 
                    disabled={isProcessing}
                    onClick={handleToggle}
                    className={cn(
                      "p-2 rounded-full transition-all duration-200",
                      isDone 
                        ? "bg-black text-white hover:bg-gray-800" 
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                    )}
                  >
                    {isProcessing ? (
                       <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                       <CheckCircle2 className={`h-6 w-6 ${isDone ? "fill-current" : ""}`} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GOALS SECTION (Skeleton) */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Goals Momentum</h3>
        <div className="space-y-3">
           {data?.goals.map((goal) => (
             <div key={goal.id} className="bg-white p-4 rounded-xl border shadow-sm">
                <span className="font-medium">{goal.name}</span>
             </div>
           ))}
        </div>
      </div>

    </div>
  );
}