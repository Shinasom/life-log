'use client';

import { useState } from 'react';
import { 
  Sparkles, 
  Brain, 
  Lightbulb, 
  RefreshCw, 
  Quote, 
  CheckCircle2, 
  Bot, 
  ArrowRight
} from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

export default function HabitCoach({ habitId }: { habitId: string }) {
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/habits/${habitId}/analyze/`);
      setInsight(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- STATE 1: LOADING (Skeleton) ---
  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-8 space-y-6 animate-pulse">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-100 rounded-full" />
              <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-48 bg-gray-100 rounded" />
              </div>
          </div>
          <div className="h-24 bg-gray-50 rounded-xl" />
          <div className="space-y-3">
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-5/6 bg-gray-100 rounded" />
              <div className="h-4 w-4/6 bg-gray-100 rounded" />
          </div>
          <div className="flex justify-center text-xs text-indigo-400 font-medium">
              <Sparkles className="h-3 w-3 mr-2 animate-spin" />
              Analyzing your history...
          </div>
      </div>
    )
  }

  // --- STATE 2: EMPTY (Call to Action) ---
  if (!insight) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-lg text-center">
        {/* Background Decor */}
        <Sparkles className="absolute top-4 right-4 h-24 w-24 text-white/10 rotate-12" />
        <Bot className="absolute -bottom-4 -left-4 h-32 w-32 text-white/5 -rotate-12" />

        <div className="relative z-10 flex flex-col items-center gap-4">
           <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
             <Brain className="h-8 w-8 text-white" />
           </div>
           
           <div>
             <h3 className="text-2xl font-bold">Unlock AI Insights</h3>
             <p className="text-indigo-100 max-w-md mx-auto mt-2 text-sm leading-relaxed">
               Your habit logs tell a story. Let our AI analyze your consistency, 
               find hidden patterns, and suggest a strategy to level up.
             </p>
           </div>

           <button 
             onClick={handleAnalyze}
             className="group flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-full text-sm font-bold hover:bg-indigo-50 hover:scale-105 transition-all shadow-xl mt-2"
           >
             Analyze My Habits
             <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
           </button>
        </div>
      </div>
    );
  }

  // --- STATE 3: RESULTS (Dashboard) ---
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-lg">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="font-bold text-gray-900 text-lg">Coach&apos;s Report</h2>
            </div>
            <button 
                onClick={handleAnalyze} 
                className="text-xs font-medium text-gray-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
            >
                <RefreshCw className="h-3 w-3" />
                Refresh
            </button>
        </div>

        {/* 1. OVERVIEW CARD */}
        <div className="bg-white border border-indigo-50 rounded-2xl p-6 shadow-sm relative">
            <Quote className="absolute top-4 left-4 h-8 w-8 text-indigo-100 -scale-x-100" />
            <p className="relative z-10 text-gray-700 font-medium text-lg leading-relaxed text-center px-6">
                &quot;{insight.overview}&quot;
            </p>
        </div>

        {/* 2. GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* PATTERNS */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h4 className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-4">
                    <Brain className="h-4 w-4" />
                    Observed Patterns
                </h4>
                <ul className="space-y-3">
                    {insight.patterns?.map((pattern: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-600 group">
                            <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                            <span className="leading-snug">{pattern}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* RECOMMENDATION */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
                <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase mb-3">
                    <Lightbulb className="h-4 w-4" />
                    Strategic Advice
                </div>
                <p className="text-amber-900 font-semibold text-lg leading-snug">
                    {insight.recommendation}
                </p>
            </div>
        </div>
    </div>
  );
}