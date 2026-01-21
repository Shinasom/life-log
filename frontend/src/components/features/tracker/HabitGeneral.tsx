import { Target, Activity, Flame, Trophy, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { differenceInDays, parseISO, format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Habit } from '@/types';

// ... Insert the `getStreakStats` helper function here or import it ...
function getStreakStats(logs: any[]) { /* ... copy helper from previous turn ... */ return {current:0, best:0} }

export default function HabitGeneral({ habit }: { habit: Habit }) {
  const logs = habit.logs || [];
  const successCount = logs.filter(l => ['DONE', 'RESISTED'].includes(l.status)).length;
  const startDate = habit.created_at ? parseISO(habit.created_at) : new Date();
  const daysSinceCreation = Math.max(1, differenceInDays(new Date(), startDate));
  const successRate = Math.round((successCount / daysSinceCreation) * 100);
  
  // Re-implement or import the streak logic
  const { current, best } = getStreakStats(logs);

  return (
    <div className="space-y-6">
        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {/* Reps */}
           <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 h-32 flex flex-col justify-between">
               <div className="flex items-center gap-2 text-gray-400">
                   <Target className="h-4 w-4" />
                   <span className="text-xs font-bold uppercase">Total Reps</span>
               </div>
               <div>
                 <div className="text-3xl font-black text-gray-900">{successCount}</div>
                 <div className="text-xs text-gray-400 mt-1">Times completed</div>
               </div>
           </div>

           {/* Consistency */}
           <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 h-32 flex flex-col justify-between">
               <div className="flex items-center gap-2 text-gray-400">
                   <Activity className="h-4 w-4" />
                   <span className="text-xs font-bold uppercase">Consistency</span>
               </div>
               <div>
                 <div className={cn(
                     "text-3xl font-black",
                     successRate >= 80 ? "text-green-500" : successRate >= 50 ? "text-yellow-500" : "text-gray-900"
                 )}>
                     {successRate}%
                 </div>
                 <div className="text-xs text-gray-400 mt-1">Since {format(startDate, 'MMM d, yyyy')}</div>
               </div>
           </div>

           {/* Streak */}
           <div className="bg-gradient-to-br from-orange-50 to-white p-5 rounded-2xl shadow-sm border border-orange-100 h-32 flex flex-col justify-between relative overflow-hidden">
               <div className="flex items-center gap-2 text-orange-400 relative z-10">
                   <Flame className="h-4 w-4" />
                   <span className="text-xs font-bold uppercase">Streak</span>
               </div>
               <div className="flex items-end gap-6 relative z-10">
                  <div>
                    <div className="text-3xl font-black text-orange-500">{current}</div>
                    <div className="text-xs text-orange-400/70 font-medium">Current</div>
                  </div>
                  <div className="w-px h-8 bg-orange-200 mb-1" />
                  <div>
                    <div className="text-xl font-bold text-gray-400">{best}</div>
                    <div className="text-xs text-gray-400 font-medium">Best</div>
                  </div>
               </div>
               <Flame className="absolute -bottom-4 -right-4 h-24 w-24 text-orange-100/50 -rotate-12 pointer-events-none" />
           </div>
        </div>

        {/* DETAILS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-4 bg-gray-50/50 border-b flex justify-between items-center">
                 <span className="text-xs font-bold text-gray-500 uppercase">Configuration</span>
             </div>
             <div className="divide-y">
                {habit.description && (
                    <div className="p-4 text-sm text-gray-600">{habit.description}</div>
                )}
                <div className="p-4 flex justify-between text-sm">
                    <span className="text-gray-500">Frequency</span>
                    <span className="font-medium">{habit.frequency}</span>
                </div>
                {habit.linked_goal && (
                    <div className="p-4 flex items-center justify-between">
                        <span className="text-sm text-gray-500">Contributing to Goal</span>
                        <Link href={`/goals/${habit.linked_goal}`} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline">
                            {habit.linked_goal_name}
                            <ExternalLink className="h-3 w-3" />
                        </Link>
                    </div>
                )}
             </div>
        </div>
    </div>
  );
}