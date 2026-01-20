'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useHabits } from '@/hooks/queries/useTracker';
import { useUIStore } from '@/hooks/stores/useUIStore';
import { 
  Loader2, ChevronRight, Zap, ArrowUpCircle, 
  Archive, Plus, Link as LinkIcon, Calendar, Clock, RotateCw 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HabitsPage() {
  const { data: habits, isLoading } = useHabits();
  const { toggleGlobalAdd } = useUIStore();
  const [filter, setFilter] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');

  if (isLoading) {
    return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;
  }

  // Filter Data (Safe check for is_active)
  const displayedHabits = habits?.filter((h: any) => {
    const isActive = h.is_active ?? true;
    return filter === 'ACTIVE' ? isActive : !isActive;
  }) || [];

  // Helper to get Frequency Icon & Text
  const getFrequencyConfig = (habit: any) => {
    switch (habit.frequency) {
      case 'WEEKLY':
        return { 
          icon: <Calendar className="h-3.5 w-3.5" />, 
          text: `Weekly (${habit.frequency_config?.days?.length || 0} days)` 
        };
      case 'WINDOWED':
        return { 
          icon: <Clock className="h-3.5 w-3.5" />, 
          text: `${habit.frequency_config?.target} times / ${habit.frequency_config?.period} days` 
        };
      default: // DAILY
        return { 
          icon: <RotateCw className="h-3.5 w-3.5" />, 
          text: 'Every Day' 
        };
    }
  };

  return (
    <div className="pt-6 px-4 pb-24 space-y-6 max-w-md mx-auto">
      
      {/* HEADER & TABS */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Inventory</h1>
          <button 
            onClick={toggleGlobalAdd}
            className="bg-black text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors"
          >
            <Plus className="h-4 w-4" /> New
          </button>
        </div>

        <div className="flex p-1 bg-gray-100 rounded-xl self-start">
          <button 
            onClick={() => setFilter('ACTIVE')}
            className={cn(
              "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
              filter === 'ACTIVE' ? "bg-white shadow text-black" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Active
          </button>
          <button 
            onClick={() => setFilter('ARCHIVED')}
            className={cn(
              "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
              filter === 'ARCHIVED' ? "bg-white shadow text-black" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Archived
          </button>
        </div>
      </div>

      {/* INVENTORY LIST */}
      <div className="space-y-3">
        {displayedHabits.length === 0 ? (
          <div className="text-center py-16 border border-dashed rounded-2xl">
            <div className="mx-auto w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              <Archive className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-400 font-medium">No {filter.toLowerCase()} habits found.</p>
          </div>
        ) : (
          displayedHabits.map((habit: any) => {
            const freq = getFrequencyConfig(habit);
            
            return (
              <Link href={`/habits/${habit.id}`} key={habit.id} className="block group">
                <div className="bg-white border rounded-xl p-4 hover:border-gray-400 transition-all flex items-center justify-between">
                  
                  <div className="flex items-start gap-3 overflow-hidden">
                    {/* TYPE ICON */}
                    <div className={cn(
                      "p-2.5 rounded-xl shrink-0",
                      habit.habit_type === 'QUIT' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                    )}>
                      {habit.habit_type === 'QUIT' ? <Zap className="h-5 w-5" /> : <ArrowUpCircle className="h-5 w-5" />}
                    </div>

                    {/* DETAILS */}
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-gray-900 truncate pr-2">
                        {habit.name}
                      </h3>
                      
                      {/* Metadata Row */}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {/* Frequency Tag */}
                        <div className="flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                           {freq.icon}
                           <span>{freq.text}</span>
                        </div>

                        {/* Linked Goal Tag */}
                        {habit.linked_goal && (
                          <div className="flex items-center gap-1 text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                             <LinkIcon className="h-3 w-3" />
                             <span className="truncate max-w-[80px]">Goal Linked</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CHEVRON */}
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-black transition-colors shrink-0 ml-2" />

                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}