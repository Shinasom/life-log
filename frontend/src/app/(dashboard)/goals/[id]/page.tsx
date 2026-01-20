'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  ArrowLeft, Calendar, Target, TrendingUp, CheckCircle2, 
  Sparkles, Loader2, PlayCircle, BarChart3, AlertCircle 
} from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

export default function GoalDetailPage() {
  const params = useParams();
  // Safe access: params might be null initially
  const id = params?.id; 
  const router = useRouter();
  const queryClient = useQueryClient();

  // 🛡️ GUARD: Only run query if ID is a valid string
  // This stops the "/api/v1/goals/undefined/" 404 error
  const isValidId = typeof id === 'string' && id !== 'undefined';

  // 1. Fetch Goal Details
  const { data: goal, isLoading } = useQuery({
    queryKey: ['goal', id],
    queryFn: async () => {
      const res = await api.get(`/goals/${id}/`);
      return res.data;
    },
    // 👇 CRITICAL FIX: Don't fetch if ID is bad
    enabled: isValidId, 
    retry: false // Don't retry 404s
  });

  // 2. Mutation: Generate AI Insight
  const generateInsight = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/ai/goals/${id}/insight/`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['goal', id], (old: any) => ({
        ...old,
        ai_insight: data
      }));
      queryClient.invalidateQueries({ queryKey: ['goal', id] });
    }
  });

  // Loading State
  if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;
  
  // Error / Not Found State
  if (!isValidId || !goal) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-400">
      <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
      <p>Goal not found</p>
      <button onClick={() => router.push('/dashboard')} className="mt-4 text-sm text-black underline">
        Return to Dashboard
      </button>
    </div>
  );

  const logs = goal.progress_logs || [];
  const completed = !!goal.completed_at;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* HEADER */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-lg leading-tight truncate">{goal.name}</h1>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              {goal.category}
            </span>
            <span>•</span>
            <span>{format(new Date(goal.created_at), 'MMM d, yyyy')}</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-md mx-auto">
        
        {/* 📊 STATUS CARD */}
        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Status</div>
              <div className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold",
                completed ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
              )}>
                {completed ? <CheckCircle2 className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                {completed ? "Completed" : "In Progress"}
              </div>
            </div>
            {completed && (
              <div className="text-right">
                 <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Finished</div>
                 <div className="font-medium text-sm">{format(new Date(goal.completed_at), 'MMM d, yyyy')}</div>
              </div>
            )}
          </div>

          {/* Simple Activity Graph */}
          {logs.length > 0 ? (
             <div className="mt-6">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                   <TrendingUp className="h-3 w-3" /> Momentum History
                </div>
                <div className="flex items-end gap-1 h-12 w-full">
                  {logs.slice(-20).map((log: any, i: number) => (
                    <div 
                      key={i} 
                      className={cn(
                        "flex-1 rounded-t-sm opacity-80",
                        log.source_habit ? "bg-blue-400" : "bg-indigo-400"
                      )}
                      style={{ height: '60%' }} 
                      title={`${log.date}: ${log.note}`}
                    ></div>
                  ))}
                </div>
             </div>
          ) : (
             <div className="mt-4 p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-400 italic">
               No progress logged yet.
             </div>
          )}
        </div>

        {/* 🤖 AI INSIGHT SECTION */}
        {completed && (
          <div className="space-y-3">
             <div className="flex items-center gap-2 px-1">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <h3 className="font-bold text-gray-900">AI Retrospective</h3>
             </div>
             
             <div className="bg-gradient-to-br from-white to-purple-50 p-1 rounded-2xl border border-purple-100 shadow-sm overflow-hidden relative">
               
               {goal.ai_insight ? (
                 // HAS INSIGHT
                 <div className="p-5 animate-in fade-in">
                    <p className="text-gray-800 leading-relaxed text-sm font-medium">
                      {goal.ai_insight.overview}
                    </p>
                    <div className="my-4 border-t border-purple-100"></div>
                    {goal.ai_insight.patterns?.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Key Patterns</h4>
                        <ul className="space-y-2">
                          {goal.ai_insight.patterns.map((pat: string, i: number) => (
                            <li key={i} className="flex gap-2.5 text-xs text-gray-600 bg-white/80 p-2.5 rounded-lg shadow-sm border border-purple-50">
                              <span className="text-purple-500 font-bold">•</span> {pat}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {goal.ai_insight.reflection && (
                       <div className="mt-4 bg-purple-100/50 p-3 rounded-xl border border-purple-100">
                         <h4 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                           <Target className="h-3 w-3" /> Strategic Takeaway
                         </h4>
                         <p className="text-xs text-purple-900 italic">"{goal.ai_insight.reflection}"</p>
                       </div>
                    )}
                 </div>
               ) : (
                 // NO INSIGHT
                 <div className="p-8 text-center bg-white">
                    <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">Analyze your Journey</h4>
                    <p className="text-xs text-gray-500 mb-5 max-w-[200px] mx-auto">
                      Let AI find patterns in your momentum and consistency.
                    </p>
                    <button 
                      onClick={() => generateInsight.mutate()}
                      disabled={generateInsight.isPending}
                      className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 mx-auto disabled:opacity-70 disabled:scale-100"
                    >
                      {generateInsight.isPending ? (
                        <><Loader2 className="h-4 w-4 animate-spin"/> Analyzing...</>
                      ) : (
                        <><Sparkles className="h-4 w-4"/> Generate Insight</>
                      )}
                    </button>
                    {generateInsight.isError && (
                      <div className="mt-4 flex items-center justify-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" /> Analysis failed.
                      </div>
                    )}
                 </div>
               )}
             </div>
          </div>
        )}

        {/* 📋 PROGRESS LOGS */}
        <div className="space-y-3 pt-2">
          <h3 className="font-bold text-gray-900 px-1">Detailed Logs</h3>
          <div className="space-y-3">
            {logs.map((log: any) => (
              <div key={log.id} className="bg-white p-3 rounded-xl border flex gap-3">
                <div className="flex flex-col items-center">
                   <div className="text-[10px] font-bold text-gray-400 uppercase">
                     {format(new Date(log.date), 'MMM')}
                   </div>
                   <div className="text-lg font-bold leading-none">
                     {format(new Date(log.date), 'd')}
                   </div>
                </div>
                <div className="flex-1 border-l pl-3 border-gray-100">
                   <p className="text-sm text-gray-800">{log.note || "Progress recorded"}</p>
                   {log.source_habit && (
                     <div className="mt-1 inline-flex items-center gap-1 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                       <CheckCircle2 className="h-3 w-3" /> via {log.source_habit.name}
                     </div>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}