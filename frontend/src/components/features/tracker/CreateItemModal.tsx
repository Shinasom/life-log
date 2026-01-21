'use client';

import { useState, useEffect } from 'react';
import { useCreateHabit, useCreateGoal, useEditHabit, useEditGoal, useGoals } from '@/hooks/queries/useTracker';
import { useUIStore } from '@/hooks/stores/useUIStore';
import { X, Loader2, Repeat, Target, Link as LinkIcon, AlignLeft, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAYS_OF_WEEK = [
  { label: 'M', value: 'MON' },
  { label: 'T', value: 'TUE' },
  { label: 'W', value: 'WED' },
  { label: 'T', value: 'THU' },
  { label: 'F', value: 'FRI' },
  { label: 'S', value: 'SAT' },
  { label: 'S', value: 'SUN' },
];

export default function CreateItemModal() {
  // 👇 UPDATED: Use the specific store selectors
  const { 
    isCreateModalOpen, 
    closeCreateModal, 
    itemToEdit, 
    activeModalType 
  } = useUIStore();
  
  // Mutations
  const createHabit = useCreateHabit();
  const editHabit = useEditHabit();
  const createGoal = useCreateGoal();
  const editGoal = useEditGoal();
  
  const { data: goals } = useGoals();
  const activeGoals = goals?.filter((g: any) => g.is_active && !g.is_completed) || [];

  // State
  const [mode, setMode] = useState<'HABIT' | 'GOAL'>('HABIT');
  const [name, setName] = useState('');
  
  // Habit State
  const [description, setDescription] = useState('');
  const [habitType, setHabitType] = useState<'BUILD' | 'QUIT'>('BUILD');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY' | 'WINDOWED'>('DAILY');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [windowTarget, setWindowTarget] = useState(1);
  const [windowPeriod, setWindowPeriod] = useState(7);

  // Goal State
  const [category, setCategory] = useState('');

  // 🔄 EFFECT: Load Data when Editing or Switch Mode
  useEffect(() => {
    if (!isCreateModalOpen) return;

    // 1. Sync the Tab Mode (Habit vs Goal) from Store
    if (activeModalType) {
        setMode(activeModalType);
    }

    // 2. Load Edit Data
    if (itemToEdit) {
      setName(itemToEdit.name);
      
      if (activeModalType === 'HABIT') {
        setDescription(itemToEdit.description || '');
        setHabitType(itemToEdit.habit_type);
        setFrequency(itemToEdit.frequency);
        setSelectedGoalId(itemToEdit.linked_goal || '');

        if (itemToEdit.frequency === 'WEEKLY') {
          setSelectedDays(itemToEdit.frequency_config?.days || []);
        } else if (itemToEdit.frequency === 'WINDOWED') {
          setWindowTarget(itemToEdit.frequency_config?.target || 1);
          setWindowPeriod(itemToEdit.frequency_config?.period || 7);
        }
      } else {
        setCategory(itemToEdit.category || '');
      }
    } else {
      // 3. Reset form for "New" mode
      setName('');
      setDescription('');
      setCategory('');
      setSelectedGoalId('');
      setHabitType('BUILD');
      setFrequency('DAILY');
      setSelectedDays([]);
      setWindowTarget(1);
      setWindowPeriod(7);
    }
  }, [isCreateModalOpen, itemToEdit, activeModalType]);


  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    // --- HABIT SUBMISSION ---
    if (mode === 'HABIT') {
      let freqConfig = {};
      if (frequency === 'WEEKLY') {
        if (selectedDays.length === 0) return alert('Select at least one day.');
        freqConfig = { days: selectedDays };
      } else if (frequency === 'WINDOWED') {
        if (windowTarget > windowPeriod) return alert('Target cannot be greater than period.');
        freqConfig = { target: windowTarget, period: windowPeriod };
      }

      const payload = {
        name,
        description,
        habit_type: habitType,
        frequency,
        frequency_config: freqConfig,
        linked_goal: selectedGoalId || null
      };

      if (itemToEdit) {
        await editHabit.mutateAsync({ id: itemToEdit.id, payload });
      } else {
        await createHabit.mutateAsync({ ...payload, tracking_mode: 'BINARY', config: {} } as any);
      }

    // --- GOAL SUBMISSION ---
    } else {
      const payload = { name, category };
      if (itemToEdit) {
        await editGoal.mutateAsync({ id: itemToEdit.id, payload });
      } else {
        await createGoal.mutateAsync(payload);
      }
    }

    closeCreateModal(); // 👈 Use the new close function
  };

  if (!isCreateModalOpen) return null;
  const isPending = createHabit.isPending || editHabit.isPending || createGoal.isPending || editGoal.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="font-black text-xl text-gray-900">
            {itemToEdit ? `Edit ${mode === 'HABIT' ? 'Habit' : 'Goal'}` : 'Create New'}
          </h2>
          <button 
            onClick={closeCreateModal} // 👈 Use updated handler
            className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs (Only show if creating new) */}
        {!itemToEdit && (
          <div className="flex p-2 gap-2 bg-gray-50/50">
            <button 
                onClick={() => setMode('HABIT')} 
                className={cn(
                    "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2", 
                    mode === 'HABIT' ? "bg-white text-black shadow-sm ring-1 ring-black/5" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                )}
            >
              <Repeat className="h-4 w-4" /> Habit
            </button>
            <button 
                onClick={() => setMode('GOAL')} 
                className={cn(
                    "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2", 
                    mode === 'GOAL' ? "bg-white text-black shadow-sm ring-1 ring-black/5" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                )}
            >
              <Target className="h-4 w-4" /> Goal
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* NAME */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                {mode === 'HABIT' ? 'Habit Name' : 'Goal Name'}
            </label>
            <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder={mode === 'HABIT' ? "e.g., Read 30 mins" : "e.g., Save $10k"} 
                className="w-full p-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-black/5 transition-all outline-none font-medium placeholder:text-gray-400" 
                autoFocus 
            />
          </div>

          {/* === HABIT FIELDS === */}
          {mode === 'HABIT' && (
            <>
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Type</label>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button type="button" onClick={() => setHabitType('BUILD')} className={cn("flex-1 text-xs font-bold py-2.5 rounded-lg transition-all", habitType === 'BUILD' ? "bg-white shadow text-green-600" : "text-gray-500")}>Build (Do more)</button>
                  <button type="button" onClick={() => setHabitType('QUIT')} className={cn("flex-1 text-xs font-bold py-2.5 rounded-lg transition-all", habitType === 'QUIT' ? "bg-white shadow text-red-600" : "text-gray-500")}>Quit (Do less)</button>
                </div>
              </div>

              {/* Frequency Engine */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                 <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                    <CalendarClock className="h-4 w-4" /> Frequency
                 </div>
                 
                 <div className="flex gap-2">
                    {['DAILY', 'WEEKLY', 'WINDOWED'].map((f) => (
                      <button 
                        key={f} 
                        type="button" 
                        onClick={() => setFrequency(f as any)}
                        className={cn("flex-1 text-xs font-bold py-2 rounded-lg border transition-all", frequency === f ? "bg-black text-white border-black" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300")}
                      >
                        {f === 'WINDOWED' ? 'Flexible' : f.charAt(0) + f.slice(1).toLowerCase()}
                      </button>
                    ))}
                 </div>

                 {frequency === 'WEEKLY' && (
                   <div className="flex justify-between pt-2">
                     {DAYS_OF_WEEK.map((day) => (
                       <button key={day.value} type="button" onClick={() => toggleDay(day.value)} className={cn("h-8 w-8 rounded-full text-[10px] font-black flex items-center justify-center transition-all", selectedDays.includes(day.value) ? "bg-black text-white" : "bg-white border border-gray-200 text-gray-400 hover:border-gray-400")}>{day.label}</button>
                     ))}
                   </div>
                 )}

                 {frequency === 'WINDOWED' && (
                   <div className="flex items-center gap-3 pt-2">
                      <span className="text-sm font-medium text-gray-600">Do it</span>
                      <input type="number" min="1" max="30" value={windowTarget} onChange={(e) => setWindowTarget(parseInt(e.target.value))} className="w-12 p-1.5 text-center border border-gray-200 rounded-lg bg-white font-bold" />
                      <span className="text-sm font-medium text-gray-600">times every</span>
                      <select value={windowPeriod} onChange={(e) => setWindowPeriod(parseInt(e.target.value))} className="p-1.5 border border-gray-200 rounded-lg bg-white text-sm font-bold">
                        <option value="7">Week</option>
                        <option value="14">2 Weeks</option>
                        <option value="30">Month</option>
                      </select>
                   </div>
                 )}
              </div>

              {/* Description & Link */}
              <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-2">Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full p-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-black/5 transition-all outline-none font-medium placeholder:text-gray-400 resize-none text-sm" placeholder="Why are you doing this?" />
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-2">Linked Goal</label>
                    <div className="relative">
                        <LinkIcon className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                        <select value={selectedGoalId} onChange={(e) => setSelectedGoalId(e.target.value)} className="w-full pl-9 p-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-black/5 outline-none text-sm font-medium appearance-none">
                        <option value="">None (Standalone)</option>
                        {activeGoals.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>
                </div>
               </div>
            </>
          )}

          {/* === GOAL FIELDS === */}
          {mode === 'GOAL' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
              <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Health, Finance..." className="w-full p-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-black/5 transition-all outline-none font-medium placeholder:text-gray-400" />
            </div>
          )}

          <button 
            type="submit" 
            disabled={isPending} 
            className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-900 disabled:opacity-50 flex items-center justify-center gap-2 mt-4 shadow-lg hover:shadow-xl transition-all transform active:scale-[0.98]"
          >
            {isPending && <Loader2 className="h-5 w-5 animate-spin" />}
            {itemToEdit ? 'Save Changes' : (mode === 'HABIT' ? 'Start Habit' : 'Set Goal')}
          </button>
        </form>
      </div>
    </div>
  );
}