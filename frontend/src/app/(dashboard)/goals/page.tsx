'use client';

import { useGoals } from '@/hooks/queries/useTracker';
import { Loader2, Target, CheckCircle2, Clock, Calendar } from 'lucide-react'; // Added icons
import { format, parseISO } from 'date-fns';

export default function GoalsPage() {
  const { data: goals, isLoading } = useGoals();

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-gray-400"/></div>;
  }

  const activeGoals = goals?.filter((g: any) => g.is_active && !g.is_completed) || [];
  const completedGoals = goals?.filter((g: any) => g.is_completed) || [];

  return (
    <div className="space-y-8 pt-4">
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Map</h1>
        <div className="text-sm text-gray-500 font-medium">{activeGoals.length} Active</div>
      </div>

      {/* ACTIVE GOALS */}
      <div className="space-y-6">
        {activeGoals.length === 0 ? (
           <div className="text-center py-10 text-gray-400 border border-dashed rounded-xl">No active goals.</div>
        ) : (
          activeGoals.map((goal: any) => (
            <div key={goal.id} className="bg-white border rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
              
              {/* Header */}
              <div className="p-5 border-b bg-gray-50/50 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-xl mb-1">{goal.name}</h3>
                  <span className="text-xs bg-black text-white px-2 py-0.5 rounded-md font-medium">{goal.category || 'General'}</span>
                </div>
                <div className="bg-white p-2 rounded-full border shadow-sm">
                   <Target className="text-black h-5 w-5" />
                </div>
              </div>

              {/* MOMENTUM HISTORY (The Evidence Log) */}
              <div className="p-5 bg-white">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Clock className="h-3 w-3" /> Momentum History
                </h4>

                {goal.logs && goal.logs.length > 0 ? (
                  <div className="relative border-l border-gray-200 ml-2 space-y-6">
                    {goal.logs.map((log: any) => (
                      <div key={log.id} className="ml-6 relative">
                        {/* Timeline Dot */}
                        <div className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full bg-black border-2 border-white ring-1 ring-gray-100"></div>
                        
                        {/* Date */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-gray-900">
                            {format(parseISO(log.date), 'MMM d, yyyy')}
                          </span>
                          {/* Optional: Show time if you tracked it, otherwise just date is fine for V1 */}
                        </div>

                        {/* Note */}
                        {log.note && (
                          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            {log.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 italic pl-2">No momentum logged yet.</div>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* COMPLETED GOALS (Simplified) */}
      {completedGoals.length > 0 && (
        <div className="space-y-4 pt-8 border-t">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Completed</h3>
          {completedGoals.map((goal: any) => (
            <div key={goal.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-3 opacity-70">
              <CheckCircle2 className="text-green-600 h-5 w-5" />
              <span className="font-medium line-through text-gray-500">{goal.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}