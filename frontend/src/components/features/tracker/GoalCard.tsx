'use client';

import { useState } from 'react';
import { Goal } from '@/types';
import { useLogGoalProgress } from '@/hooks/queries/useTracker';
import { format } from 'date-fns';
import { TrendingUp, Loader2, Target, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function GoalCard({ goal }: { goal: Goal }) {
  const logProgress = useLogGoalProgress();
  const [note, setNote] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // 🛡️ STRICTOR GUARD: Stop if ID is missing, null, or the string "undefined"
  const isValidId = goal?.id && goal.id !== 'undefined';
  
  if (!isValidId) return null;

  const handleLogMomentum = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await logProgress.mutateAsync({
      goal_id: goal.id,
      date: format(new Date(), 'yyyy-MM-dd'),
      moved_forward: true,
      note: note,
    });
    setNote('');
    setIsExpanded(false);
  };

  return (
    <div className={cn(
      "bg-white border rounded-xl shadow-sm transition-all overflow-hidden",
      isExpanded ? "ring-2 ring-black border-transparent" : "hover:border-gray-300"
    )}>
      <div className="flex items-stretch">
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-4 flex flex-1 items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full transition-colors",
              isExpanded ? "bg-black text-white" : "bg-gray-100 text-gray-600"
            )}>
              <Target className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 leading-none mb-1">{goal.name}</h4>
              <p className="text-xs text-gray-500 font-medium">
                {goal.category || 'General'}
              </p>
            </div>
          </div>
          
          <div className="text-gray-400">
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>

        {/* 🔗 DIRECT LINK TO DETAIL PAGE */}
        {/* Added prefetch={false} to stop background 404s */}
        <Link 
          href={`/goals/${goal.id}`} 
          prefetch={false} 
          className="flex items-center px-4 border-l border-gray-50 hover:bg-gray-50 transition-colors text-gray-400 hover:text-black"
          title="View Details & AI Insights"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-2">
          <form onSubmit={handleLogMomentum} className="flex flex-col gap-3">
            <input 
              autoFocus
              type="text" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note (optional)..." 
              className="w-full text-sm bg-gray-50 border-transparent focus:border-gray-300 focus:bg-white rounded-lg px-3 py-3 outline-none border transition-all placeholder:text-gray-400"
            />
            <button 
              type="submit"
              disabled={logProgress.isPending}
              className="w-full bg-black text-white py-2.5 rounded-lg font-bold text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {logProgress.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <TrendingUp className="h-4 w-4" />}
              Log Momentum
            </button>
          </form>
          
          {goal.logs && goal.logs.length > 0 && (
             <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
                <span>Last entry:</span>
                <span className="font-medium text-gray-600 truncate max-w-[150px]">
                  {goal.logs[0].note || "Momentum logged"}
                </span>
             </div>
          )}
        </div>
      )}
    </div>
  );
}