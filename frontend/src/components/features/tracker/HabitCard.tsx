'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { 
  Loader2, CheckCircle2, XCircle, Circle, TrendingUp, 
  AlertCircle, Clock, MoreVertical, Edit2, Trash2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useLogHabit, 
  useDeleteHabitLog, 
  useLogGoalProgress, 
  useDeleteHabit 
} from '@/hooks/queries/useTracker';
import { useUIStore } from '@/hooks/stores/useUIStore';
import { Habit } from '@/types';

interface HabitCardProps {
  habit: Habit;
  selectedDate: Date;
}

export default function HabitCard({ habit, selectedDate }: HabitCardProps) {
  // Queries & Mutations
  const logHabit = useLogHabit();
  const deleteLog = useDeleteHabitLog();
  const logGoal = useLogGoalProgress();
  const deleteHabit = useDeleteHabit();
  
  // Stores
  const { openEditModal, openConfirm } = useUIStore(); // 👈 Added openConfirm

  // Habit Data
  const log = habit.today_log;
  const status = log?.status; 
  const logId = log?.id;

  // Local State
  const [noteText, setNoteText] = useState(log?.note || '');
  const [isNoteOpen, setIsNoteOpen] = useState(!!log?.note);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Bridge Popup State
  const [showGoalPrompt, setShowGoalPrompt] = useState(false);
  const [bridgeNote, setBridgeNote] = useState(''); 

  const isProcessing = 
    (logHabit.isPending && logHabit.variables?.habit_id === habit.id) ||
    (deleteLog.isPending && deleteLog.variables === logId);

  // --- LOGIC: SMART SUBTITLE ---
  const getSubtitle = () => {
    if (habit.frequency === 'WINDOWED' && habit.window_progress) {
      const { current, target, days_remaining } = habit.window_progress;
      const dayLabel = days_remaining === 1 ? 'day' : 'days';
      return (
        <span className="flex items-center gap-1.5 text-black font-medium">
          <Clock className="h-3 w-3 text-gray-400" />
          <span>{current} / {target} done</span>
          <span className="text-gray-300">•</span>
          <span className={cn("text-xs", days_remaining <= 1 ? "text-red-500 font-bold" : "text-gray-400")}>
            {days_remaining} {dayLabel} left
          </span>
        </span>
      );
    }
    
    if (habit.frequency === 'WEEKLY' && habit.frequency_config?.days) {
      const days = habit.frequency_config.days
        .map((d: string) => d.charAt(0) + d.slice(1).toLowerCase())
        .join(', ');
      return `Weekly • ${days}`;
    }

    return `${habit.habit_type === 'QUIT' ? 'Quit' : 'Build'} • ${habit.frequency.charAt(0) + habit.frequency.slice(1).toLowerCase()}`;
  };

  // --- HANDLERS ---
  const handleMarkDone = async () => {
    // 1. Log the habit as done
    await logHabit.mutateAsync({
      habit_id: habit.id,
      date: format(selectedDate, 'yyyy-MM-dd'),
      status: habit.habit_type === 'QUIT' ? 'RESISTED' : 'DONE'
    });
    
    // 👇 2. SMART CHECK:
    // Only ask for momentum if:
    // a) There is a linked goal
    // b) The goal is NOT completed
    if (habit.linked_goal && !habit.linked_goal_is_completed) {
      setShowGoalPrompt(true);
    }
  };

  const handleMarkMissed = () => {
    logHabit.mutate({
      habit_id: habit.id,
      date: format(selectedDate, 'yyyy-MM-dd'),
      status: 'MISSED'
    });
    setShowGoalPrompt(false); 
  };

  const handleUndo = () => {
    if (logId) deleteLog.mutate(logId);
    setShowGoalPrompt(false);
  };

  const handleLogMomentum = () => {
    if (!habit.linked_goal) return;
    logGoal.mutate({
      goal_id: habit.linked_goal,
      date: format(selectedDate, 'yyyy-MM-dd'),
      moved_forward: true,
      note: bridgeNote || `Momentum via habit: ${habit.name}`,
      habit_id: habit.id // 👈 PASS THE ID HERE
    });
    setShowGoalPrompt(false); 
    setBridgeNote('');
  };

  // --- DELETE HANDLER (NEW) ---
  const handleDelete = () => {
    setIsMenuOpen(false); // Close menu immediately
    openConfirm({
      title: "Delete Habit?",
      message: `Are you sure you want to delete "${habit.name}"? This will permanently remove the habit and all its history.`,
      actionLabel: "Delete Forever",
      onConfirm: async () => {
        await deleteHabit.mutateAsync(habit.id);
      }
    });
  };

  // --- RENDER HELPERS ---
  const isFailed = status === 'FAILED';
  const isDone = status === 'DONE' || status === 'RESISTED';
  const isWindowed = habit.frequency === 'WINDOWED';

  return (
    <div 
      className={cn(
        "bg-white p-4 rounded-xl border shadow-sm transition-all hover:shadow-md relative",
        (status === 'MISSED' || isFailed) && "bg-gray-50 opacity-75 border-gray-200"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-4">
          <h4 className={cn(
            "font-medium transition-all text-base",
            isDone && "text-gray-400 line-through",
            (status === 'MISSED' || isFailed) && "text-gray-400"
          )}>
            {habit.name}
          </h4>
          
          <div className="text-xs text-gray-500 mt-1">
            {getSubtitle()}
          </div>
        </div>

        <div className="flex items-center gap-2">
           {isProcessing ? (
             <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
           ) : (
             <>
               {/* 1. EMPTY STATE (No Log) */}
               {!status && (
                 <>
                   {!isWindowed && (
                     <button onClick={handleMarkMissed} className="text-gray-200 hover:text-red-400 transition-colors p-1">
                       <XCircle className="h-8 w-8 stroke-[1.5]" />
                     </button>
                   )}
                   
                   <button onClick={handleMarkDone} className="text-gray-200 hover:text-black transition-colors p-1">
                     <Circle className="h-10 w-10 stroke-[1.5]" />
                   </button>
                 </>
               )}

               {/* 2. DONE STATE */}
               {isDone && (
                 <button onClick={handleUndo} className="text-black transition-transform hover:scale-110 p-1">
                   <CheckCircle2 className="h-9 w-9 fill-black text-white" />
                 </button>
               )}

               {/* 3. MISSED (User Clicked) */}
               {status === 'MISSED' && (
                 <button onClick={handleUndo} className="text-red-500 transition-transform hover:scale-110 p-1">
                   <XCircle className="h-9 w-9 fill-red-100" />
                 </button>
               )}

               {/* 4. FAILED (System Generated) */}
               {isFailed && (
                 <div className="flex items-center gap-1 text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                   <AlertCircle className="h-4 w-4" />
                   <span className="text-xs font-bold uppercase tracking-wide">Window Missed</span>
                 </div>
               )}
             </>
           )}

           {/* 👇 EDIT / DELETE MENU */}
           <div className="relative ml-1">
             <button 
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} 
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
             >
               <MoreVertical className="h-4 w-4" />
             </button>
             
             {isMenuOpen && (
               <div className="absolute right-0 top-8 bg-white shadow-xl border border-gray-100 rounded-lg overflow-hidden z-20 min-w-[120px] animate-in fade-in zoom-in-95">
                 <button 
                   onClick={() => { openEditModal('HABIT', habit); setIsMenuOpen(false); }}
                   className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                 >
                   <Edit2 className="h-3 w-3" /> Edit
                 </button>
                 <button 
                   onClick={handleDelete}
                   className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                 >
                   <Trash2 className="h-3 w-3" /> Delete
                 </button>
               </div>
             )}
           </div>

        </div>
      </div>

      {/* 🌉 BRIDGE POPUP (Unchanged) */}
      {showGoalPrompt && isDone && (
        <div className="mt-4 bg-gray-900 text-white p-4 rounded-xl shadow-xl animate-in slide-in-from-top-2">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wider font-bold">Linked Goal</div>
              <div className="font-bold text-base leading-tight">{habit.linked_goal_name}</div>
            </div>
            <button onClick={() => setShowGoalPrompt(false)} className="text-gray-500 hover:text-white"><XCircle className="h-5 w-5" /></button>
          </div>
          <textarea
            value={bridgeNote}
            onChange={(e) => setBridgeNote(e.target.value)}
            placeholder="Add a note (optional)..."
            className="w-full bg-gray-800 text-sm text-white p-2.5 rounded-lg border-none focus:ring-1 focus:ring-gray-500 outline-none mb-3 resize-none placeholder:text-gray-600"
            rows={2}
            autoFocus
          />
          <button onClick={handleLogMomentum} className="w-full bg-white text-black py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95">
            {logGoal.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <TrendingUp className="h-4 w-4" />}
            Log Momentum
          </button>
        </div>
      )}

      {/* NOTES (Unchanged) */}
      {status && !showGoalPrompt && !isFailed && (
        <div className="mt-2 animate-in fade-in pl-1">
           {!isNoteOpen ? (
             <button onClick={() => setIsNoteOpen(true)} className="text-xs text-gray-300 hover:text-gray-500 flex items-center gap-1 transition-colors">
               + Add note
             </button>
           ) : (
             <textarea
               value={noteText}
               onChange={(e) => setNoteText(e.target.value)}
               onBlur={() => {
                  if(!status) return;
                  logHabit.mutate({ habit_id: habit.id, date: format(selectedDate, 'yyyy-MM-dd'), status, note: noteText });
               }}
               placeholder="How did it go?"
               className="w-full text-sm p-2 bg-gray-50 rounded-lg border-none resize-none focus:ring-1 focus:ring-gray-200 outline-none placeholder:text-gray-300"
               rows={2}
               autoFocus
             />
           )}
        </div>
      )}
    </div>
  );
}