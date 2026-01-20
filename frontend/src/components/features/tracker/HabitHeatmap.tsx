'use client';

import { 
  format, 
  eachDayOfInterval, 
  isSameDay, 
  parseISO, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  eachWeekOfInterval 
} from 'date-fns';
import { cn } from '@/lib/utils';
import { HabitLog } from '@/types';

interface HabitHeatmapProps {
  logs: HabitLog[];
  createdAt: string; // We need this to know where to start
}

export default function HabitHeatmap({ logs, createdAt }: HabitHeatmapProps) {
  const today = new Date();
  
  // 1. Determine Start Date (Creation Date aligned to Monday)
  // Fallback to 1 month ago if creation date is missing or invalid
  const rawStartDate = createdAt ? parseISO(createdAt) : new Date();
  const startDate = startOfWeek(rawStartDate, { weekStartsOn: 1 }); // Monday start
  
  // 2. Generate Weeks from Start -> Today
  const weeks = eachWeekOfInterval({
    start: startDate,
    end: today
  }, { weekStartsOn: 1 });

  const getStatusColor = (date: Date) => {
    // Don't render future days
    if (date > today) return "bg-gray-50"; 
    
    // Don't render days before creation (but keep the grid cell for alignment)
    if (date < rawStartDate && !isSameDay(date, rawStartDate)) return "bg-transparent";

    const log = logs.find(l => isSameDay(parseISO(l.date), date));
    
    if (!log) return "bg-gray-100"; // Empty but valid day
    if (log.status === 'DONE' || log.status === 'RESISTED') return "bg-green-500";
    if (log.status === 'MISSED' || log.status === 'FAILED') return "bg-red-400";
    if (log.status === 'PARTIAL') return "bg-yellow-400";
    return "bg-gray-100";
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Consistency Map</h3>
        <span className="text-[10px] text-gray-400">
           Started {format(rawStartDate, 'MMM d, yyyy')}
        </span>
      </div>
      
      {/* Scrollable Container */}
      <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex gap-[3px]">
          {weeks.map((weekStart, i) => (
            <div key={i} className="flex flex-col gap-[3px]">
              {/* Render 7 days for this week */}
              {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
                const dayDate = addDays(weekStart, dayOffset);
                return (
                  <div 
                    key={dayDate.toISOString()}
                    title={format(dayDate, 'MMM d, yyyy')}
                    className={cn(
                      "h-3 w-3 rounded-[2px] transition-colors",
                      getStatusColor(dayDate)
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-3 text-[10px] text-gray-400">
         <div className="flex items-center gap-1"><div className="w-2 h-2 bg-gray-100 rounded-[1px]"/> Empty</div>
         <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-[1px]"/> Done</div>
         <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-400 rounded-[1px]"/> Missed</div>
      </div>
    </div>
  );
}