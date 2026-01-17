'use client';

import { useUIStore } from '@/hooks/stores/useUIStore';
import { useTodayData } from '@/hooks/queries/useTracker';
import { format, addDays } from 'date-fns';
import { Loader2 } from 'lucide-react';
import HabitCard from '@/components/features/tracker/HabitCard'; // 👈 Import new component

export default function TodayPage() {
  const { selectedDate, setSelectedDate } = useUIStore();
  const { data, isLoading, isError } = useTodayData(selectedDate);

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
    return <div className="p-4 text-red-500">Failed to load data.</div>;
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
          
          {/* 👇 CLEAN LOOP: No hooks inside! */}
          {data?.habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} selectedDate={selectedDate} />
          ))}
        </div>
      </div>

      {/* GOALS SECTION */}
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