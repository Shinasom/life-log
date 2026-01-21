'use client';

import { Habit, HabitLog } from '@/types';
import { 
  Activity, 
  Trophy, 
  Calendar, 
  TrendingUp, 
  Target,
  Zap,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, CartesianGrid
} from 'recharts';
import { parseISO, format, subDays, isSameDay, getDay, startOfToday, differenceInDays, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';

// --- HELPERS ---

function calculateStreak(logs: HabitLog[] = []) {
    if (!logs || logs.length === 0) return 0;
    
    const sorted = [...logs]
        .filter(l => ['DONE', 'RESISTED'].includes(l.status))
        .sort((a, b) => b.date.localeCompare(a.date));

    if (sorted.length === 0) return 0;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    
    const lastSuccess = sorted[0].date;
    if (lastSuccess !== todayStr && lastSuccess !== yesterdayStr) return 0;

    let streak = 1;
    for (let i = 0; i < sorted.length - 1; i++) {
        const curr = parseISO(sorted[i].date);
        const prev = parseISO(sorted[i+1].date);
        const diff = differenceInDays(curr, prev);

        if (diff === 1) streak++;
        else break;
    }
    return streak;
}

// 1. SYSTEM PULSE (Dynamic Start Date)
function getSystemPulseData(habits: Habit[]) {
    const today = startOfToday();
    
    // Find the earliest creation date among active habits to determine chart start
    const creationDates = habits.map(h => parseISO(h.created_at).getTime());
    const earliestDate = creationDates.length > 0 ? new Date(Math.min(...creationDates)) : today;
    
    // Cap at 30 days max, but allow shorter if user is new
    const daysAlive = differenceInDays(today, earliestDate);
    const windowSize = Math.min(Math.max(daysAlive, 6), 29); // Min 7 points for a line, Max 30

    const data = [];
    
    for (let i = windowSize; i >= 0; i--) {
        const date = subDays(today, i);
        let volume = 0;
        
        habits.forEach(h => {
            // Only count habit if it existed on this specific date
            if (isAfter(date, subDays(parseISO(h.created_at), 1))) {
                const log = h.logs?.find(l => isSameDay(parseISO(l.date), date));
                if (log && ['DONE', 'RESISTED'].includes(log.status)) {
                    volume += 1;
                }
            }
        });

        data.push({
            date: format(date, 'MMM d'),
            volume: volume
        });
    }
    return data;
}

// 2. DAY OF WEEK AGGREGATE (Normalized)
function getWeeklyAggregate(habits: Habit[]) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = Array(7).fill(0);
    
    habits.forEach(h => {
        h.logs?.forEach(l => {
            if (['DONE', 'RESISTED'].includes(l.status)) {
                const dayIdx = getDay(parseISO(l.date));
                counts[dayIdx]++;
            }
        });
    });

    const max = Math.max(...counts, 1);
    return days.map((day, i) => ({
        day,
        count: counts[i],
        intensity: counts[i] / max
    }));
}

// 3. LEADERBOARD (Time-Based Consistency)
function getHabitRankings(habits: Habit[]) {
    const today = startOfToday();

    const ranked = habits
        .filter(h => h.is_active)
        .map(h => {
            const logs = h.logs || [];
            const streak = calculateStreak(logs);
            const successes = logs.filter(l => ['DONE', 'RESISTED'].includes(l.status)).length;
            
            // CORRECT LOGIC: Denominator is days since creation
            const createdAt = parseISO(h.created_at);
            const daysActive = Math.max(1, differenceInDays(today, createdAt) + 1); // +1 to include today
            
            const rate = Math.round((successes / daysActive) * 100);
            
            // Score weighted by recent streak to favor current momentum
            const score = rate + (streak * 10);
            
            return { ...h, score, rate, calculated_streak: streak, days_active: daysActive };
        })
        .sort((a, b) => b.score - a.score);

    return ranked.slice(0, 3);
}

export default function GlobalHabitStats({ habits }: { habits: Habit[] }) {
  const activeHabits = habits.filter(h => h.is_active);
  const pulseData = getSystemPulseData(activeHabits);
  const weeklyData = getWeeklyAggregate(activeHabits);
  const topHabits = getHabitRankings(activeHabits);

  // Global Stats Calculations
  const totalReps = activeHabits.reduce((acc, h) => {
      return acc + (h.logs?.filter(l => ['DONE', 'RESISTED'].includes(l.status)).length || 0);
  }, 0);

  // Average Consistency (Time-Based)
  const today = startOfToday();
  const avgConsistency = activeHabits.length > 0 ? Math.round(
      activeHabits.reduce((acc, h) => {
          const logs = h.logs || [];
          const successes = logs.filter(l => ['DONE', 'RESISTED'].includes(l.status)).length;
          const daysActive = Math.max(1, differenceInDays(today, parseISO(h.created_at)) + 1);
          return acc + (successes / daysActive);
      }, 0) / activeHabits.length * 100
  ) : 0;

  if (activeHabits.length === 0) {
      return (
          <div className="p-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No active habits to analyze.</p>
              <p className="text-xs text-gray-400 mt-1">Create a habit to unlock system stats.</p>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* ROW 1: HERO STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <div className="text-gray-400 text-xs font-bold uppercase mb-1">Consistency</div>
                    <div className="text-4xl font-black text-gray-900">{avgConsistency}%</div>
                    <div className="text-xs text-gray-500 mt-1">System average</div>
                </div>
                <div className="h-14 w-14 rounded-full bg-indigo-50 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-indigo-600" />
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <div className="text-gray-400 text-xs font-bold uppercase mb-1">Total Reps</div>
                    <div className="text-4xl font-black text-gray-900">{totalReps}</div>
                    <div className="text-xs text-gray-500 mt-1">Lifetime completions</div>
                </div>
                <div className="h-14 w-14 rounded-full bg-green-50 flex items-center justify-center">
                    <Target className="h-6 w-6 text-green-600" />
                </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-indigo-900 p-6 rounded-2xl shadow-md text-white flex items-center justify-between relative overflow-hidden">
                <div className="relative z-10">
                    <div className="text-indigo-200 text-xs font-bold uppercase mb-1">Active Habits</div>
                    <div className="text-4xl font-black">{activeHabits.length}</div>
                    <div className="text-xs text-indigo-300 mt-1">Currently tracking</div>
                </div>
                <Zap className="absolute -bottom-4 -right-4 h-24 w-24 text-white/10 -rotate-12" />
            </div>
        </div>

        {/* ROW 2: PULSE CHART */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">System Pulse</h3>
                    <p className="text-sm text-gray-500">Daily habit volume</p>
                </div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Last {pulseData.length} Days
                </span>
            </div>
            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={pulseData}>
                        <defs>
                            <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 10, fill: '#9ca3af'}} 
                            interval="preserveStartEnd"
                            minTickGap={30}
                        />
                        <Tooltip 
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="volume" 
                            stroke="#6366f1" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#colorVolume)" 
                            animationDuration={1000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* ROW 3: WEEKLY & LEADERBOARD */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Weekly Rhythm */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    Weekly Flow
                </h3>
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData}>
                            <XAxis 
                                dataKey="day" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 12, fill: '#6b7280'}} 
                            />
                            <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
                            <Bar dataKey="count" radius={[4, 4, 4, 4]}>
                                {weeklyData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.intensity > 0.8 ? '#4f46e5' : entry.intensity > 0.4 ? '#818cf8' : '#e0e7ff'} 
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-gray-400" />
                    Top Performers
                </h3>
                <div className="flex-1 space-y-3">
                    {topHabits.map((h, i) => (
                        <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                    i === 0 ? "bg-yellow-100 text-yellow-700" :
                                    i === 1 ? "bg-gray-200 text-gray-700" :
                                    "bg-orange-100 text-orange-700"
                                )}>
                                    {i + 1}
                                </div>
                                <span className="font-medium text-gray-900 text-sm truncate max-w-[120px]">{h.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-500">{h.rate}% Rate</span>
                                {h.calculated_streak > 2 && (
                                    <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" /> {h.calculated_streak}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                    {topHabits.length === 0 && (
                        <div className="text-center text-gray-400 text-xs py-4 italic">
                            Log some habits to see rankings.
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}