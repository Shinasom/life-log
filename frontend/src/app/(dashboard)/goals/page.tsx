'use client';

import Link from 'next/link';
import { useGoals } from '@/hooks/queries/useTracker';
import { Loader2, Target, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function GoalsPage() {
  const { data: goals, isLoading } = useGoals();

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-gray-400"/></div>;
  }

  const activeGoals = goals?.filter((g: any) => g.is_active && !g.is_completed) || [];
  const completedGoals = goals?.filter((g: any) => g.is_completed) || [];

  return (
    <div className="space-y-8 pt-4 pb-20">
      
      <div className="flex items-center justify-between px-1">
        <h1 className="text-2xl font-bold">Your Map</h1>
        <div className="text-sm text-gray-500 font-medium">{activeGoals.length} Active</div>
      </div>

      {/* ACTIVE GOALS */}
      <div className="space-y-4">
        {activeGoals.length === 0 ? (
           <div className="text-center py-10 text-gray-400 border border-dashed rounded-xl">No active goals.</div>
        ) : (
          activeGoals.map((goal: any) => (
            // 🔗 LINK WRAPPER: Makes the whole card clickable
            <Link href={`/goals/${goal.id}`} key={goal.id} className="block group">
              <div className="bg-white border rounded-xl shadow-sm group-hover:shadow-md transition-all overflow-hidden relative">
                
                {/* Hover Indicator */}
                <div className="absolute right-4 top-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="text-gray-400" />
                </div>

                {/* Header */}
                <div className="p-5 border-b bg-gray-50/50 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg mb-1 group-hover:text-blue-600 transition-colors">{goal.name}</h3>
                    <span className="text-xs bg-black text-white px-2 py-0.5 rounded-md font-medium">{goal.category || 'General'}</span>
                  </div>
                  <div className="bg-white p-2 rounded-full border shadow-sm mr-6">
                     <Target className="text-black h-5 w-5" />
                  </div>
                </div>

                {/* Latest Update Preview (Only show last 1 log to keep list clean) */}
                <div className="p-4 bg-white">
                  {goal.logs && goal.logs.length > 0 ? (
                    <div className="flex items-start gap-3 text-sm text-gray-600">
                      <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-gray-900 block mb-0.5">
                          Last: {format(parseISO(goal.logs[0].date), 'MMM d')}
                        </span>
                        <span className="line-clamp-1 text-gray-500">
                          {goal.logs[0].note || "Progress recorded"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 italic pl-1">No history yet. Tap to view details.</div>
                  )}
                </div>

              </div>
            </Link>
          ))
        )}
      </div>

      {/* COMPLETED GOALS */}
      {completedGoals.length > 0 && (
        <div className="space-y-4 pt-8 border-t">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">Completed History</h3>
          {completedGoals.map((goal: any) => (
            <Link href={`/goals/${goal.id}`} key={goal.id} className="block group">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between group-hover:bg-white group-hover:shadow-sm transition-all">
                <div className="flex items-center gap-3 opacity-70 group-hover:opacity-100">
                  <CheckCircle2 className="text-green-600 h-5 w-5" />
                  <span className="font-medium line-through text-gray-500 group-hover:text-gray-800 transition-colors">
                    {goal.name}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                   {goal.completed_at ? format(parseISO(goal.completed_at), 'MMM d, yyyy') : 'Done'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}