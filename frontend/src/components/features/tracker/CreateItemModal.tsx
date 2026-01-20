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
  const { isGlobalAddOpen, toggleGlobalAdd, itemToEdit, editType } = useUIStore();
  
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

  // 🔄 EFFECT: Load Data when Editing
  useEffect(() => {
    if (isGlobalAddOpen && itemToEdit) {
      setMode(editType || 'HABIT');
      setName(itemToEdit.name);
      
      if (editType === 'HABIT') {
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
    } else if (isGlobalAddOpen && !itemToEdit) {
      // Reset form for "New" mode
      setName('');
      setDescription('');
      setCategory('');
      setSelectedGoalId('');
      setHabitType('BUILD');
      setFrequency('DAILY');
      setSelectedDays([]);
      setWindowTarget(1);
      setWindowPeriod(7);
      setMode('HABIT');
    }
  }, [isGlobalAddOpen, itemToEdit, editType]);


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

    toggleGlobalAdd();
  };

  if (!isGlobalAddOpen) return null;
  const isPending = createHabit.isPending || editHabit.isPending || createGoal.isPending || editGoal.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-lg">{itemToEdit ? 'Edit Item' : 'Create New'}</h2>
          <button onClick={toggleGlobalAdd} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs (Only show if creating new) */}
        {!itemToEdit && (
          <div className="flex p-2 gap-2 border-b bg-gray-50">
            <button onClick={() => setMode('HABIT')} className={cn("flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2", mode === 'HABIT' ? "bg-white shadow text-black" : "text-gray-500")}>
              <Repeat className="h-4 w-4" /> Habit
            </button>
            <button onClick={() => setMode('GOAL')} className={cn("flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2", mode === 'GOAL' ? "bg-white shadow text-black" : "text-gray-500")}>
              <Target className="h-4 w-4" /> Goal
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-5">
          
          {/* NAME */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{mode === 'HABIT' ? 'I want to...' : 'My Goal is to...'}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name your item" className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none" autoFocus />
          </div>

          {/* === HABIT FIELDS === */}
          {mode === 'HABIT' && (
            <>
              {/* Type Switcher */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Habit Type</label>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button type="button" onClick={() => setHabitType('BUILD')} className={cn("flex-1 text-xs font-medium py-2 rounded-md transition-all", habitType === 'BUILD' ? "bg-white shadow text-green-600" : "text-gray-500")}>Build (Do more)</button>
                  <button type="button" onClick={() => setHabitType('QUIT')} className={cn("flex-1 text-xs font-medium py-2 rounded-md transition-all", habitType === 'QUIT' ? "bg-white shadow text-red-600" : "text-gray-500")}>Quit (Do less)</button>
                </div>
              </div>

              {/* Frequency Engine */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                 <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <CalendarClock className="h-4 w-4" /> Frequency
                 </div>
                 
                 <div className="flex gap-2">
                    {['DAILY', 'WEEKLY', 'WINDOWED'].map((f) => (
                      <button 
                        key={f} 
                        type="button" 
                        onClick={() => setFrequency(f as any)}
                        className={cn("flex-1 text-xs py-1.5 rounded border transition-all", frequency === f ? "bg-black text-white border-black" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300")}
                      >
                        {f === 'WINDOWED' ? 'Flexible' : f.charAt(0) + f.slice(1).toLowerCase()}
                      </button>
                    ))}
                 </div>

                 {frequency === 'WEEKLY' && (
                   <div className="flex justify-between pt-2">
                     {DAYS_OF_WEEK.map((day) => (
                       <button key={day.value} type="button" onClick={() => toggleDay(day.value)} className={cn("h-8 w-8 rounded-full text-xs font-bold flex items-center justify-center transition-all", selectedDays.includes(day.value) ? "bg-black text-white" : "bg-gray-200 text-gray-500 hover:bg-gray-300")}>{day.label}</button>
                     ))}
                   </div>
                 )}

                 {frequency === 'WINDOWED' && (
                   <div className="flex items-center gap-2 pt-2">
                      <span className="text-sm text-gray-500">Do it</span>
                      <input type="number" min="1" max="30" value={windowTarget} onChange={(e) => setWindowTarget(parseInt(e.target.value))} className="w-12 p-1 text-center border rounded bg-white" />
                      <span className="text-sm text-gray-500">times in</span>
                      <select value={windowPeriod} onChange={(e) => setWindowPeriod(parseInt(e.target.value))} className="p-1 border rounded bg-white text-sm">
                        <option value="7">7 days</option>
                        <option value="14">14 days</option>
                        <option value="30">30 days</option>
                      </select>
                   </div>
                 )}
              </div>

              {/* Description & Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><AlignLeft className="h-3 w-3" /> Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none resize-none" />
              </div>
              
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><LinkIcon className="h-3 w-3" /> Link to Goal</label>
                 <select value={selectedGoalId} onChange={(e) => setSelectedGoalId(e.target.value)} className="w-full p-3 rounded-lg border border-gray-300 bg-white outline-none">
                   <option value="">No link</option>
                   {activeGoals.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                 </select>
               </div>
            </>
          )}

          {/* === GOAL FIELDS === */}
          {mode === 'GOAL' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Health, Finance..." className="w-full p-3 rounded-lg border border-gray-300 outline-none" />
            </div>
          )}

          <button type="submit" disabled={isPending} className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {itemToEdit ? 'Save Changes' : (mode === 'HABIT' ? 'Create Habit' : 'Set Goal')}
          </button>
        </form>
      </div>
    </div>
  );
}