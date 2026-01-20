'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  useGoal, 
  useCompleteGoal, 
  useLogGoalProgress, 
  useDeleteGoal 
} from '@/hooks/queries/useTracker';
import { useUIStore } from '@/hooks/stores/useUIStore';
import { format, parseISO, differenceInDays } from 'date-fns';
import { 
  ArrowLeft, Trophy, Calendar, TrendingUp, Clock, 
  CheckCircle2, Loader2, X, Trash2, Edit2, Sparkles 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GoalProgress } from '@/types';
import { useQueryClient } from '@tanstack/react-query';

// 👇 1. Import your existing components
import GoalInsightCard from '@/components/features/goals/GoalInsightCard';
import HabitHeatmap from '@/components/features/tracker/HabitHeatmap';

export default function GoalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const goalId = params?.id as string;
  const queryClient = useQueryClient();

  // Hooks
  const { data: goal, isLoading } = useGoal(goalId);
  const completeGoal = useCompleteGoal();
  const logProgress = useLogGoalProgress();
  const deleteGoal = useDeleteGoal(); 
  const { openEditModal, openConfirm } = useUIStore(); 

  // State
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completionNote, setCompletionNote] = useState('');
  const [newLogNote, setNewLogNote] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-gray-400" /></div>;
  }

  if (!goal) return <div className="p-4">Goal not found</div>;

  const daysActive = goal.created_at 
    ? differenceInDays(new Date(), parseISO(goal.created_at)) 
    : 0;

  const logs: GoalProgress[] = goal.logs || [];

  // 👇 2. ADAPTER: Convert Goal Logs to Habit Logs for the Heatmap
  // 'moved_forward' = DONE, otherwise MISSED.
  const heatmapLogs = logs.map(log => ({
    ...log,
    status: log.moved_forward ? 'DONE' : 'MISSED' 
  })) as any; // Cast as any or HabitLog to satisfy the component prop type

  // --- HANDLERS ---

  const handleComplete = async () => {
    try {
      setIsAnalyzing(true);
      await completeGoal.mutateAsync({ id: goal.id, note: completionNote });
      setIsCompleteModalOpen(false);
      
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
        setIsAnalyzing(false);
      }, 2000); 
    } catch (error) {
      setIsAnalyzing(false);
    }
  };

  const handleManualInsight = async () => {
    setIsAnalyzing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsAnalyzing(false), 1500);
    }
  };

  const handleDelete = () => {
    openConfirm({
      title: "Delete Goal?",
      message: "Are you sure? This will delete the goal and all associated momentum logs.",
      actionLabel: "Delete Goal",
      onConfirm: async () => {
        await deleteGoal.mutateAsync(goal.id);
        router.push('/goals'); 
      }
    });
  };

  const handleLogMomentum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogNote.trim()) return;
    
    await logProgress.mutateAsync({
      goal_id: goal.id,
      date: format(new Date(), 'yyyy-MM-dd'),
      moved_forward: true,
      note: newLogNote
    });
    setNewLogNote('');
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-20">
      
      {/* HEADER */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="font-semibold text-sm">Goal Details</span>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => openEditModal('GOAL', goal)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button 
            onClick={handleDelete}
            className="p-2 text-red-500 hover:bg-red-50 rounded-full"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* --- HERO CARD --- */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
          {goal.is_completed && (
            <div className="absolute top-0 right-0 bg-green-100 text-green-700 px-3 py-1 text-xs font-bold rounded-bl-xl">
              COMPLETED
            </div>
          )}
          
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            {goal.category || 'General'}
          </div>
          <h1 className="text-2xl font-bold mb-4">{goal.name}</h1>
          
          <div className="flex gap-4 text-sm text-gray-600 mb-6">
            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>{daysActive} days active</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
              <TrendingUp className="h-4 w-4 text-gray-400" />
              <span>{logs.length} logs</span>
            </div>
          </div>

          {/* 👇 3. REUSE EXISTING HEATMAP COMPONENT */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <HabitHeatmap 
                  logs={heatmapLogs} 
                  createdAt={goal.created_at || new Date().toISOString()} 
                />
          </div>
        </div>

        {/* --- COMPLETION REFLECTION --- */}
        {goal.is_completed && goal.completion_note && (
          <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2 text-green-800 font-semibold text-sm">
              <Trophy className="h-4 w-4" /> Completion Reflection
            </div>
            <p className="text-green-900 text-sm italic">"{goal.completion_note}"</p>
            <div className="mt-2 text-xs text-green-600">
              Completed on {goal.completed_at && format(parseISO(goal.completed_at), 'MMMM d, yyyy')}
            </div>
          </div>
        )}

        {/* --- AI INSIGHT CARD --- */}
        {goal.is_completed && (
          <GoalInsightCard 
            insight={goal.ai_insight}
            isAnalyzing={isAnalyzing}
            onRetry={handleManualInsight}
          />
        )}

        {/* --- EVIDENCE HISTORY & INPUT --- */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" /> Evidence History
          </h3>
          
          {/* Manual Log Input */}
          {!goal.is_completed && (
            <div className="mb-6 bg-white p-3 rounded-xl border border-gray-200 shadow-sm sticky top-20 z-10">
                <form onSubmit={handleLogMomentum} className="flex gap-2">
                  <input
                    type="text"
                    value={newLogNote}
                    onChange={(e) => setNewLogNote(e.target.value)}
                    placeholder="Add a note (optional)..."
                    className="flex-1 bg-gray-50 border-transparent focus:bg-white focus:border-black rounded-lg px-3 py-2 text-sm outline-none border transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={logProgress.isPending || !newLogNote.trim()}
                    className="bg-black text-white px-4 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-2 text-xs font-bold"
                  >
                    {logProgress.isPending ? <Loader2 className="h-3 w-3 animate-spin"/> : <TrendingUp className="h-3 w-3" />}
                    Log
                  </button>
                </form>
            </div>
          )}

          {/* History List */}
          <div className="space-y-0 relative pl-2">
            <div className="absolute left-[7px] top-2 bottom-4 w-0.5 bg-gray-200"></div>

            {logs.length > 0 ? (
              logs.slice().reverse().map((log: GoalProgress) => (
                <div key={log.id} className="relative pl-6 pb-6 last:pb-0 group">
                  <div className={cn(
                    "absolute left-0 top-1.5 h-4 w-4 rounded-full border-4 transition-colors z-10 bg-white",
                    log.source_habit ? "border-blue-400 group-hover:border-blue-600" : "border-gray-300 group-hover:border-black"
                  )}></div>
                  
                  <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm group-hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-gray-500">
                        {format(parseISO(log.date), 'MMM d, yyyy')}
                      </span>
                      {log.source_habit_name && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                          via {log.source_habit_name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-800">
                      {log.note || <span className="text-gray-400 italic">Momentum logged</span>}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-xl border border-dashed">
                No momentum recorded yet.<br/>Link a habit or log manually above to start building history.
              </div>
            )}
          </div>
        </div>

        {/* --- FOOTER ACTION --- */}
        {!goal.is_completed && (
          <div className="pt-8 pb-4">
            <button
              onClick={() => setIsCompleteModalOpen(true)}
              className="w-full group flex items-center justify-center gap-2 text-gray-400 hover:text-green-600 hover:bg-green-50 py-3 rounded-xl transition-all text-sm font-medium border border-transparent hover:border-green-100"
            >
              <Trophy className="h-4 w-4" />
              Mark Goal as Completed
            </button>
          </div>
        )}
      </div>

      {/* --- COMPLETION MODAL --- */}
      {isCompleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Complete Goal?</h2>
                  <p className="text-sm text-gray-500 mt-1">This will archive "{goal.name}" and generate your AI momentum report.</p>
                </div>
                <button onClick={() => setIsCompleteModalOpen(false)} className="text-gray-400 hover:text-black">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Final Reflection (Optional)
                </label>
                <textarea
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  placeholder="What did you learn? How do you feel?"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black outline-none resize-none text-sm bg-gray-50"
                  rows={3}
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="flex-1 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleComplete}
                  disabled={completeGoal.isPending}
                  className="flex-1 bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {completeGoal.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4" />}
                  Complete & Analyze
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}