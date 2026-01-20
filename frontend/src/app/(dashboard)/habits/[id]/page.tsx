'use client';

import Link from 'next/link'; // 👈 Import Link
import { useRouter, useParams } from 'next/navigation';
import { useHabit, useDeleteHabit } from '@/hooks/queries/useTracker';
import { useUIStore } from '@/hooks/stores/useUIStore';
import { 
  ArrowLeft, Edit2, Trash2, Target, Loader2, ExternalLink 
} from 'lucide-react'; // 👈 Import ExternalLink
import { differenceInDays, parseISO, format, subDays } from 'date-fns';
import { cn } from '@/lib/utils'; // 👈 Import cn
import HabitHeatmap from '@/components/features/tracker/HabitHeatmap';
import { HabitLog } from '@/types';

// 👇 UTILITY: Calculate Current Streak
function calculateStreak(logs: HabitLog[]) {
  if (!logs || logs.length === 0) return 0;

  // 1. Filter successful logs & Sort descending
  const successDates = logs
    .filter(l => l.status === 'DONE' || l.status === 'RESISTED')
    .map(l => l.date) // 'yyyy-MM-dd' string
    .sort((a, b) => b.localeCompare(a)); // Newest first

  if (successDates.length === 0) return 0;

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  // 2. Check if streak is alive (Must have done it Today or Yesterday)
  const hasToday = successDates.includes(todayStr);
  const hasYesterday = successDates.includes(yesterdayStr);

  if (!hasToday && !hasYesterday) return 0;

  // 3. Count consecutive days
  let streak = 0;
  let checkDate = hasToday ? new Date() : subDays(new Date(), 1);

  while (true) {
    const dateStr = format(checkDate, 'yyyy-MM-dd');
    if (successDates.includes(dateStr)) {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }
  return streak;
}

export default function HabitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const habitId = params.id as string;

  const { data: habit, isLoading } = useHabit(habitId);
  const deleteHabit = useDeleteHabit();
  const { openEditModal, openConfirm } = useUIStore();

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-gray-400"/></div>;
  if (!habit) return <div className="p-4">Habit not found</div>;

  // --- STATS CALCULATION ---
  const logs = habit.logs || [];
  
  // 1. Total Reps
  const successCount = logs.filter((l: any) => l.status === 'DONE' || l.status === 'RESISTED').length;
  
  // 2. Success Rate
  const startDate = habit.created_at ? parseISO(habit.created_at) : new Date();
  const daysSinceCreation = Math.max(1, differenceInDays(new Date(), startDate)); // Avoid division by zero
  const successRate = Math.round((successCount / daysSinceCreation) * 100);

  // 3. Current Streak
  const currentStreak = calculateStreak(logs);

  const handleDelete = () => {
    openConfirm({
      title: "Delete Habit?",
      message: "This will permanently delete this habit and all its history. This cannot be undone.",
      actionLabel: "Delete Forever",
      onConfirm: async () => {
        await deleteHabit.mutateAsync(habit.id);
        router.push('/habits'); 
      }
    });
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-20">
      
      {/* HEADER */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="font-semibold text-sm">Habit Details</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => openEditModal('HABIT', habit)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <Edit2 className="h-4 w-4" />
          </button>
          <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* HERO CARD */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{habit.habit_type}</span>
                <h1 className="text-2xl font-bold mt-1">{habit.name}</h1>
                <p className="text-sm text-gray-500 mt-1">{habit.description || "No description"}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <Target className="h-6 w-6 text-black" />
              </div>
           </div>

           {/* STATS ROW */}
           <div className="flex gap-4 border-t pt-4">
             <div className="flex-1">
               <div className="text-2xl font-bold">{successCount}</div>
               <div className="text-xs text-gray-500">Total Reps</div>
             </div>
             <div className="flex-1 border-l pl-4">
               <div className="text-2xl font-bold">{successRate}%</div>
               <div className="text-xs text-gray-500">Success Rate</div>
             </div>
             <div className="flex-1 border-l pl-4">
               <div className="text-2xl font-bold">{currentStreak}</div> 
               <div className="text-xs text-gray-500">Current Streak</div>
             </div>
           </div>
        </div>

        {/* HEATMAP */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <HabitHeatmap 
                logs={logs} 
                createdAt={habit.created_at} 
            />
        </div>

        {/* DETAILS LIST */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="p-4 border-b bg-gray-50/50 text-xs font-bold text-gray-500 uppercase">Configuration</div>
           <div className="divide-y">
              <div className="p-4 flex justify-between text-sm">
                 <span className="text-gray-500">Frequency</span>
                 <span className="font-medium">{habit.frequency}</span>
              </div>
              <div className="p-4 flex justify-between text-sm">
                 <span className="text-gray-500">Tracking Mode</span>
                 <span className="font-medium">{habit.tracking_mode}</span>
              </div>

              {/* 👇 UPDATED LINKED GOAL SECTION */}
              {habit.linked_goal && (
                <div className="p-4 flex justify-between items-center text-sm">
                   <span className="text-gray-500">Linked Goal</span>
                   <Link 
                     href={`/goals/${habit.linked_goal}`}
                     className="group flex items-center gap-2 text-right hover:bg-gray-50 p-1.5 -mr-1.5 rounded-lg transition-colors"
                   >
                     <div className="flex flex-col items-end">
                       <span className="font-medium text-black group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                         {habit.linked_goal_name || "Unknown Goal"}
                         <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-blue-500" />
                       </span>
                       
                       {/* Status Badge */}
                       <span className={cn(
                         "text-[10px] font-bold uppercase tracking-wider",
                         habit.linked_goal_is_completed ? "text-green-600" : "text-blue-500"
                       )}>
                         {habit.linked_goal_is_completed ? "Completed" : "Active"}
                       </span>
                     </div>
                   </Link>
                </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}