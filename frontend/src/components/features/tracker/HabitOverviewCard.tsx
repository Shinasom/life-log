'use client';

import Link from 'next/link';
import { Habit } from '@/types';
import { ChevronRight, Repeat, Flame } from 'lucide-react';

export default function HabitOverviewCard({ habit }: { habit: Habit }) {
  // Fallback for optional fields
  const streak = habit.streak || 0; 

  return (
    <Link 
      href={`/habits/${habit.id}`}
      className="group flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300"
    >
      <div className="space-y-1.5">
          <h3 className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">
            {habit.name}
          </h3>
          
          <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
             {/* Frequency Badge */}
             <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                <Repeat className="h-3 w-3 text-gray-400" />
                <span className="uppercase tracking-wider">{habit.frequency}</span>
             </div>

             {/* Streak Badge (Only shows if active) */}
             {streak > 0 && (
                 <div className="flex items-center gap-1 text-orange-500 font-bold">
                    <Flame className="h-3.5 w-3.5 fill-orange-500" />
                    <span>{streak} Day Streak</span>
                 </div>
             )}
          </div>
      </div>

      {/* Arrow Button */}
      <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
         <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-white" />
      </div>
    </Link>
  );
}