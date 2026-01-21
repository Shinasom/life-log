'use client';

import { Calendar, TrendingUp, PieChart as PieIcon, Activity, Zap, AlertCircle } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, 
  LineChart, Line, YAxis, CartesianGrid,
  PieChart, Pie, Legend
} from 'recharts';
import { parseISO, getDay, format, startOfMonth, isSameMonth, subMonths } from 'date-fns';
import HabitHeatmap from '@/components/features/tracker/HabitHeatmap';
import { Habit, HabitLog } from '@/types';

// --- HELPER FUNCTIONS ---

function getDayOfWeekData(logs: HabitLog[]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const counts = Array(7).fill(0);
  
  logs.forEach(log => {
      if (['DONE', 'RESISTED'].includes(log.status)) {
          const idx = getDay(parseISO(log.date));
          counts[idx]++;
      }
  });

  return days.map((day, i) => ({ name: day, count: counts[i] }));
}

function getNumericTrend(logs: HabitLog[]) {
    return logs
        .filter(l => l.entry_value !== null && l.entry_value !== undefined)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(l => ({
            date: format(parseISO(l.date), 'MMM d'),
            value: Number(l.entry_value)
        }))
        .slice(-30);
}

function getStatusDistribution(logs: HabitLog[]) {
    const counts = { DONE: 0, RESISTED: 0, PARTIAL: 0, MISSED: 0, FAILED: 0 };
    logs.forEach(l => {
        if (l.status in counts) counts[l.status as keyof typeof counts]++;
    });

    return [
        { name: 'Done', value: counts.DONE, color: '#22c55e' },
        { name: 'Resisted', value: counts.RESISTED, color: '#eab308' },
        { name: 'Partial', value: counts.PARTIAL, color: '#f97316' },
        { name: 'Missed', value: counts.MISSED + counts.FAILED, color: '#ef4444' },
    ].filter(d => d.value > 0);
}

function getMonthlyPerformance(logs: HabitLog[], createdAt: string) {
    const today = new Date();
    const start = createdAt ? parseISO(createdAt) : subMonths(today, 5);
    let current = startOfMonth(start);
    
    const data = [];

    while (current <= today) {
        const monthLogs = logs.filter(l => isSameMonth(parseISO(l.date), current));
        const successCount = monthLogs.filter(l => ['DONE', 'RESISTED'].includes(l.status)).length;
        const totalRecorded = Math.max(monthLogs.length, 1);
        const rate = Math.round((successCount / totalRecorded) * 100);

        data.push({
            name: format(current, 'MMM'),
            rate: rate,
            total: successCount
        });

        current = new Date(current.setMonth(current.getMonth() + 1));
    }
    
    return data.slice(-6);
}

function getResilienceScore(logs: HabitLog[]) {
    if (logs.length < 2) return 0;
    
    const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
    
    let fails = 0;
    let recovered = 0;

    for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i+1];

        if (['MISSED', 'FAILED'].includes(current.status)) {
            fails++;
            if (['DONE', 'RESISTED'].includes(next.status)) {
                recovered++;
            }
        }
    }

    if (fails === 0) return 100; 
    return Math.round((recovered / fails) * 100);
}

// --- SUB-COMPONENT: EMPTY STATE ---
const EmptyChartState = ({ message }: { message: string }) => (
    <div className="h-full w-full flex flex-col items-center justify-center text-gray-400">
        <AlertCircle className="h-6 w-6 mb-2 opacity-50" />
        <span className="text-xs">{message}</span>
    </div>
);

// --- MAIN COMPONENT ---

export default function HabitStats({ habit }: { habit: Habit }) {
  const logs = habit.logs || [];
  const hasLogs = logs.length > 0;
  
  const weeklyData = getDayOfWeekData(logs);
  const numericData = habit.tracking_mode === 'NUMERIC' ? getNumericTrend(logs) : [];
  const pieData = getStatusDistribution(logs);
  const monthlyData = getMonthlyPerformance(logs, habit.created_at);
  const resilienceScore = getResilienceScore(logs);

  return (
    <div className="space-y-6">
        
        {/* ROW 1: HEATMAP */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                Consistency Map
            </h3>
            <div className="flex-1 min-h-[150px]">
                <HabitHeatmap logs={logs} createdAt={habit.created_at} />
            </div>
        </div>

        {/* ROW 2: RESILIENCE & PIE CHART */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 2a. STATUS BREAKDOWN */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <PieIcon className="h-4 w-4 text-gray-400" />
                    Quality Breakdown
                </h3>
                <div style={{ height: 200, width: '100%' }} className="text-xs">
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{borderRadius: '8px', border: 'none'}} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChartState message="No data to analyze yet" />
                    )}
                </div>
            </div>

            {/* 2b. RESILIENCE SCORE CARD */}
            <div className="space-y-6">
                <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl shadow-sm border border-indigo-100 h-full flex flex-col justify-center relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase mb-2">
                            <Zap className="h-4 w-4" />
                            Resilience Score
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-indigo-600">{resilienceScore}%</span>
                            <span className="text-sm text-indigo-400">Bounce Back Rate</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                            {!hasLogs ? "Start logging to calculate score." : 
                             resilienceScore >= 80 ? "Unstoppable! You almost always recover immediately after a miss." : 
                             resilienceScore >= 50 ? "Good recovery. You usually get back on track within a day." :
                             "Watch out for the 'spiral'. Try not to miss two days in a row."}
                        </p>
                    </div>
                    <Zap className="absolute -bottom-4 -right-4 h-32 w-32 text-indigo-100/50 -rotate-12 pointer-events-none" />
                </div>
            </div>
        </div>

        {/* ROW 3: TRENDS (WEEKLY & MONTHLY) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* 3a. Weekly */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-400" />
                    Weekly Rhythm
                </h3>
                <div style={{ height: 200, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData}>
                            <XAxis dataKey="name" tick={{fontSize: 10, fill: '#9CA3AF'}} axisLine={false} tickLine={false}/>
                            <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
                            <Bar dataKey="count" radius={[4, 4, 4, 4]}>
                                {weeklyData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#3B82F6' : '#E5E7EB'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 3b. Monthly */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    Monthly Success Rate
                </h3>
                <div style={{ height: 200, width: '100%' }}>
                    {hasLogs ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData}>
                                <XAxis dataKey="name" tick={{fontSize: 10, fill: '#9CA3AF'}} axisLine={false} tickLine={false}/>
                                {/* 👇 FIXED: Use 'any' to bypass strict TS check on Formatter */}
                                <Tooltip 
                                    cursor={{fill: '#F3F4F6'}} 
                                    contentStyle={{borderRadius: '8px', border: 'none'}} 
                                    formatter={(value: any) => [`${value}%`, 'Success Rate']}
                                />
                                <Bar dataKey="rate" radius={[4, 4, 4, 4]}>
                                    {monthlyData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.rate >= 80 ? '#22c55e' : entry.rate >= 50 ? '#eab308' : '#ef4444'} 
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChartState message="No history available yet" />
                    )}
                </div>
            </div>
        </div>

        {/* ROW 4: NUMERIC TREND (Conditional) */}
        {habit.tracking_mode === 'NUMERIC' && numericData.length > 1 && (
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gray-400"/>
                    Volume Trend
                </h3>
                <div style={{ height: 200, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={numericData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/>
                            <XAxis 
                                dataKey="date" 
                                tick={{fontSize: 10}} 
                                axisLine={false} 
                                tickLine={false}
                            />
                            <YAxis 
                                tick={{fontSize: 10}} 
                                axisLine={false} 
                                tickLine={false}
                            />
                            <Tooltip 
                                contentStyle={{borderRadius: '8px', border: 'none'}}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#2563EB" 
                                strokeWidth={3} 
                                dot={{r: 4, fill: '#2563EB', strokeWidth: 0}}
                                activeDot={{r: 6}}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
             </div>
        )}
    </div>
  );
}