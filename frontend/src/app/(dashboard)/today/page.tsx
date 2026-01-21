'use client';

import { useTodayData } from '@/hooks/queries/useTracker';
import { useUIStore } from '@/hooks/stores/useUIStore';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Target } from 'lucide-react';
import HabitCard from '@/components/features/tracker/HabitCard';
import GoalCard from '@/components/features/tracker/GoalCard'; 
import CreateItemModal from '@/components/features/tracker/CreateItemModal';

export default function DashboardPage() {
  // 👇 UPDATED: Use 'openCreateModal' instead of 'toggleGlobalAdd'
  const { selectedDate, setSelectedDate, openCreateModal } = useUIStore();
  const { data, isLoading } = useTodayData(selectedDate);

  const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const isToday = isSameDay(selectedDate, new Date());
  
  const activeGoals = data?.goals?.filter((g: any) => !g.is_completed) || [];

  return (
    <div className="pb-24 pt-4 px-1 space-y-8">
      
      {/* --- DATE HEADER --- */}
      <div className="flex items-center justify-between sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 py-2 border-b border-gray-100">
        <div className="flex items-center gap-4">
           <div className="flex bg-white rounded-xl border shadow-sm p-1">
             <button onClick={handlePrevDay} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><ChevronLeft className="h-5 w-5"/></button>
             <button onClick={handleNextDay} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><ChevronRight className="h-5 w-5"/></button>
           </div>
           <div>
             <h2 className="text-xl font-bold leading-none">{isToday ? 'Today' : format(selectedDate, 'EEEE')}</h2>
             <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1">
               <CalendarIcon className="h-3 w-3" />
               {format(selectedDate, 'MMM do, yyyy')}
             </p>
           </div>
        </div>
      </div>

      {/* --- HABITS SECTION --- */}
      <div className="space-y-4">
        {data?.habits?.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-400 text-sm mb-4">No habits scheduled for today.</p>
            {/* 👇 UPDATED: Open specifically for HABIT */}
            <button 
              onClick={() => openCreateModal('HABIT')} 
              className="text-black font-bold text-sm underline hover:text-gray-600"
            >
              Create your first habit
            </button>
          </div>
        ) : (
          data?.habits?.map((habit: any) => (
            <HabitCard key={habit.id} habit={habit} selectedDate={selectedDate} />
          ))
        )}
      </div>

      {/* --- GOALS SECTION --- */}
      {activeGoals.length > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
            <Target className="h-3 w-3" /> Active Goals
          </h3>
          <div className="grid gap-3">
            {activeGoals.map((goal: any) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      {isToday && (
        <button
          onClick={() => openCreateModal('HABIT')} // 👇 UPDATED
          className="fixed bottom-24 right-6 h-14 w-14 bg-black text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform z-40"
        >
          <span className="text-2xl font-light mb-1">+</span>
        </button>
      )}

      <CreateItemModal />
    </div>
  );
}