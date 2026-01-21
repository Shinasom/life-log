// frontend/src/app/(dashboard)/habits/[id]/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useHabit, useDeleteHabit } from '@/hooks/queries/useTracker';
import { useUIStore } from '@/hooks/stores/useUIStore';
import { ArrowLeft, Edit2, Trash2, Loader2, LayoutGrid, BarChart3, Book, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// Sub-Components
import HabitGeneral from '@/components/features/tracker/HabitGeneral';
import HabitStats from '@/components/features/tracker/HabitStats';
import HabitJournal from '@/components/features/tracker/HabitJournal';
import HabitCoach from '@/components/features/tracker/HabitCoach'; // Ensure you created this from the previous step

export default function HabitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const habitId = params.id as string;
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'STATS' | 'LOGS' | 'INSIGHTS'>('GENERAL');

  const { data: habit, isLoading } = useHabit(habitId);
  const deleteHabit = useDeleteHabit();
  const { openEditModal, openConfirm } = useUIStore();

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-gray-400"/></div>;
  if (!habit) return <div className="p-10 text-center text-gray-500">Habit not found</div>;

  const handleDelete = () => {
    openConfirm({
      title: "Delete Habit?",
      message: "This will permanently delete this habit and all its history.",
      actionLabel: "Delete Forever",
      onConfirm: async () => {
        await deleteHabit.mutateAsync(habit.id);
        router.push('/habits'); 
      }
    });
  };

  const tabs = [
    { id: 'GENERAL', label: 'Overview', icon: LayoutGrid },
    { id: 'STATS', label: 'Statistics', icon: BarChart3 },
    { id: 'LOGS', label: 'Journal', icon: Book },
    { id: 'INSIGHTS', label: 'Coach', icon: Sparkles },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto min-h-screen bg-gray-50/50 pb-20">
      
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div className="flex flex-col">
                    <h1 className="font-bold text-xl leading-tight text-gray-900">{habit.name}</h1>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        {habit.frequency} • {habit.tracking_mode}
                    </span>
                </div>
            </div>
            <div className="flex gap-1">
                <button onClick={() => openEditModal('HABIT', habit)} className="p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-colors">
                    <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={handleDelete} className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors">
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex gap-6 border-b border-gray-100 -mb-4 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                        "pb-3 flex items-center gap-2 text-sm font-medium transition-colors border-b-2",
                        activeTab === tab.id 
                            ? "border-black text-black" 
                            : "border-transparent text-gray-400 hover:text-gray-600"
                    )}
                >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                </button>
            ))}
        </div>
      </div>

      <div className="p-6">
         {activeTab === 'GENERAL' && <HabitGeneral habit={habit} />}
         {activeTab === 'STATS' && <HabitStats habit={habit} />}
         {activeTab === 'LOGS' && <HabitJournal habit={habit} />}
         {activeTab === 'INSIGHTS' && <HabitCoach habitId={habit.id} />}
      </div>
    </div>
  );
}