'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Target, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/hooks/stores/useUIStore';

export default function BottomNav() {
  const pathname = usePathname();
  const { toggleGlobalAdd } = useUIStore();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 pb-6 z-40 flex justify-around items-center max-w-md mx-auto w-full">
      {/* TODAY TAB */}
      <Link 
        href="/today" 
        className={cn(
          "flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16",
          isActive('/today') ? "text-black" : "text-gray-400 hover:text-gray-600"
        )}
      >
        <Calendar className={cn("h-6 w-6", isActive('/today') && "fill-current")} />
        <span className="text-[10px] font-medium">Today</span>
      </Link>

      {/* BIG FAB (Add) */}
      <button 
        onClick={toggleGlobalAdd}
        className="bg-black text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-transform hover:scale-105 -mt-8 border-4 border-gray-50"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* GOALS TAB */}
      <Link 
        href="/goals" 
        className={cn(
          "flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16",
          isActive('/goals') ? "text-black" : "text-gray-400 hover:text-gray-600"
        )}
      >
        <Target className={cn("h-6 w-6", isActive('/goals') && "fill-current")} />
        <span className="text-[10px] font-medium">Goals</span>
      </Link>
    </div>
  );
}