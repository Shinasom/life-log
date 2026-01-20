'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Target, Repeat } from 'lucide-react'; // Added Repeat icon for Habits
import { cn } from '@/lib/utils';

export default function BottomNav() {
  const pathname = usePathname();

  // Helper for active state
  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 pb-6 z-40 flex justify-around items-center max-w-md mx-auto w-full">
      
      {/* LEFT: GOALS */}
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

      {/* CENTER: TODAY */}
      <Link 
        href="/today" 
        className={cn(
          "flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16",
          isActive('/') ? "text-black" : "text-gray-400 hover:text-gray-600"
        )}
      >
        <Calendar className={cn("h-6 w-6", isActive('/') && "fill-current")} />
        <span className="text-[10px] font-medium">Today</span>
      </Link>

      {/* RIGHT: HABITS */}
      <Link 
        href="/habits" 
        className={cn(
          "flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16",
          isActive('/habits') ? "text-black" : "text-gray-400 hover:text-gray-600"
        )}
      >
        <Repeat className={cn("h-6 w-6", isActive('/habits') && "fill-current")} />
        <span className="text-[10px] font-medium">Habits</span>
      </Link>

    </div>
  );
}