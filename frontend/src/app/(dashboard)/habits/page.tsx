'use client';

import { useHabits } from '@/hooks/queries/useTracker';
import { useUIStore } from '@/hooks/stores/useUIStore';
import { Plus, LayoutGrid, BarChart3, Sparkles } from 'lucide-react';
import HabitOverviewCard from '@/components/features/tracker/HabitOverviewCard';
import CreateItemModal from '@/components/features/tracker/CreateItemModal';
import GlobalHabitStats from '@/components/features/tracker/GlobalHabitStats';
import GlobalHabitInsights from '@/components/features/tracker/GlobalHabitInsights';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Habit } from '@/types';

export default function HabitsPage() {
  const { data: habits, isLoading } = useHabits();
  // 👇 UPDATED: Destructure specific actions from the store
  const { openCreateModal } = useUIStore(); 
  
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'STATS' | 'INSIGHTS'>('GENERAL');

  const tabs = [
    { id: 'GENERAL', label: 'Overview', icon: LayoutGrid },
    { id: 'STATS', label: 'Statistics', icon: BarChart3 },
    { id: 'INSIGHTS', label: 'Insights', icon: Sparkles },
  ] as const;

  const activeHabits = habits?.filter((h: Habit) => h.is_active !== false) || [];
  const archivedHabits = habits?.filter((h: Habit) => h.is_active === false) || [];

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER & TABS */}
      <div className="flex flex-col gap-6 sticky top-0 bg-white/80 backdrop-blur-md z-10 pt-4 pb-2 border-b border-gray-100 -mx-6 px-6">
          <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-black tracking-tight text-gray-900">Habits</h1>
                <p className="text-sm text-gray-500">Manage your system.</p>
            </div>
            {/* 👇 UPDATED: Use store action directly */}
            <button 
                onClick={() => openCreateModal('HABIT')}
                className="bg-black text-white p-3 rounded-full hover:scale-105 transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
                <Plus className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-6">
              {tabs.map(tab => (
                  <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                          "pb-2 flex items-center gap-2 text-sm font-medium transition-colors border-b-2",
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

      {/* CONTENT AREA */}
      {isLoading ? (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
             {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
         </div>
      ) : (
         <div className="min-h-[500px]">
            {/* TAB 1: GENERAL (Overview) */}
            {activeTab === 'GENERAL' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeHabits.map((habit: Habit) => (
                            <HabitOverviewCard key={habit.id} habit={habit} />
                        ))}
                    </div>
                    
                    {activeHabits.length === 0 && (
                        <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                            No active habits. Click + to start building your system.
                        </div>
                    )}
                    
                    {archivedHabits.length > 0 && (
                        <div className="pt-8 border-t">
                            <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Archived</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60 hover:opacity-100 transition-opacity">
                                {archivedHabits.map((habit: Habit) => (
                                    <HabitOverviewCard key={habit.id} habit={habit} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: STATS */}
            {activeTab === 'STATS' && (
                <GlobalHabitStats habits={habits || []} />
            )}

            {/* TAB 3: INSIGHTS */}
            {activeTab === 'INSIGHTS' && (
                <GlobalHabitInsights habits={habits || []} />
            )}
         </div>
      )}

      {/* 👇 FIXED: Remove props here */}
      <CreateItemModal />
    </div>
  );
}