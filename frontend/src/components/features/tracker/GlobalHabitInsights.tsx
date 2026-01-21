'use client';

import { useState } from 'react';
import { Habit } from '@/types';
import { 
  Sparkles, 
  Brain, 
  Network, 
  ArrowRight, 
  RefreshCw,
  Lightbulb,
  Link as LinkIcon
} from 'lucide-react';
import api from '@/lib/api';

export default function GlobalHabitInsights({ habits }: { habits: Habit[] }) {
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      // Calls the new 'detail=False' endpoint we just made
      const { data } = await api.get('/habits/global_insight/');
      setInsight(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- STATE 1: INTRO (Call to Action) ---
  if (!insight && !loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-indigo-900 rounded-2xl p-10 text-white text-center shadow-xl relative overflow-hidden">
        {/* Background Animation Elements */}
        <Network className="absolute top-10 right-10 h-32 w-32 text-white/5 rotate-12" />
        <Brain className="absolute -bottom-5 -left-5 h-40 w-40 text-white/5 -rotate-12" />
        
        <div className="relative z-10 max-w-lg mx-auto space-y-6">
            <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-md border border-white/20">
                <Sparkles className="h-8 w-8 text-indigo-300" />
            </div>
            
            <div>
                <h2 className="text-3xl font-black tracking-tight">System Intelligence</h2>
                <p className="text-indigo-200 mt-3 text-lg leading-relaxed">
                    Don't just track habits in isolation. Let AI analyze your entire log matrix to find 
                    <span className="text-white font-bold"> hidden correlations</span> and 
                    <span className="text-white font-bold"> domino effects</span>.
                </p>
            </div>

            <button 
                onClick={handleAnalyze}
                className="group bg-white text-indigo-900 px-8 py-4 rounded-full font-bold hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all flex items-center gap-3 mx-auto"
            >
                Analyze My System
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <p className="text-xs text-indigo-400 uppercase tracking-widest font-semibold">
                Analyzes {habits.length} Active Habits
            </p>
        </div>
      </div>
    );
  }

  // --- STATE 2: LOADING ---
  if (loading) {
      return (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center space-y-4 animate-pulse">
            <div className="bg-indigo-100 h-16 w-16 rounded-full mx-auto flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
            <h3 className="text-gray-900 font-bold text-lg">Connecting the dots...</h3>
            <p className="text-gray-500 text-sm">Examining cross-habit patterns and daily logs.</p>
        </div>
      );
  }

  // --- STATE 3: RESULTS ---
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Network className="h-5 w-5 text-indigo-600" />
                System Report
            </h2>
            <button 
                onClick={handleAnalyze} 
                className="text-xs font-medium text-gray-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
            >
                <RefreshCw className="h-3 w-3" />
                Re-scan
            </button>
        </div>

        {/* 1. SYSTEM HEALTH (Hero) */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 relative overflow-hidden">
            <div className="relative z-10">
                <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">System Health</div>
                <p className="text-xl font-medium text-indigo-900 leading-relaxed">
                    &quot;{insight.system_health}&quot;
                </p>
            </div>
            <Sparkles className="absolute -top-4 -right-4 h-24 w-24 text-indigo-200/50 rotate-12 pointer-events-none" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 2. CORRELATIONS */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase mb-4">
                    <LinkIcon className="h-4 w-4" />
                    Correlations Found
                </h3>
                <ul className="space-y-4">
                    {insight.correlations?.map((item: string, i: number) => (
                        <li key={i} className="flex gap-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                            <span className="leading-relaxed">{item}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* 3. STRATEGY */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col">
                <h3 className="flex items-center gap-2 text-sm font-bold text-amber-600 uppercase mb-4">
                    <Lightbulb className="h-4 w-4" />
                    Key Strategy
                </h3>
                <div className="flex-1 flex items-center">
                    <p className="text-lg font-semibold text-amber-900 leading-snug">
                        {insight.strategy}
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
}