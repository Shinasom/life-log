import { 
  Sparkles, BrainCircuit, Lightbulb, Loader2, BarChart3 
} from 'lucide-react';

interface GoalInsight {
  overview: string;
  patterns: string[];
  reflection: string | null;
}

interface GoalInsightCardProps {
  insight?: GoalInsight | null;
  isAnalyzing: boolean;
  onRetry: () => void;
}

export default function GoalInsightCard({ insight, isAnalyzing, onRetry }: GoalInsightCardProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-4 w-4 text-purple-600" />
        <h3 className="font-bold text-gray-900">AI Retrospective</h3>
      </div>

      <div className="bg-gradient-to-br from-white to-purple-50 p-1 rounded-2xl border border-purple-100 shadow-sm overflow-hidden relative min-h-[150px]">
        {insight ? (
          <div className="p-5 animate-in fade-in duration-700">
            {/* Overview */}
            <p className="text-gray-800 leading-relaxed text-sm font-medium border-l-2 border-purple-300 pl-3">
              {insight.overview}
            </p>

            <div className="my-4 border-t border-purple-100"></div>

            {/* Patterns */}
            {insight.patterns?.length > 0 && (
              <div className="space-y-3 mb-4">
                <h4 className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-wider">
                  <BrainCircuit className="h-3 w-3" /> Key Patterns
                </h4>
                <ul className="grid gap-2">
                  {insight.patterns.map((pat: string, i: number) => (
                    <li key={i} className="text-xs text-gray-700 bg-white/60 p-2.5 rounded-lg border border-purple-50 flex gap-2">
                      <span className="block w-1.5 h-1.5 rounded-full bg-purple-400 mt-1 shrink-0" />
                      {pat}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Strategic Reflection */}
            {insight.reflection && (
              <div className="bg-purple-100/50 p-3 rounded-xl border border-purple-100">
                <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" /> Strategic Takeaway
                </h4>
                <p className="text-xs text-purple-900 italic">"{insight.reflection}"</p>
              </div>
            )}
          </div>
        ) : (
          /* Empty / Loading State */
          <div className="p-8 text-center bg-white flex flex-col items-center justify-center h-full">
            {isAnalyzing ? (
              <>
                <Loader2 className="h-8 w-8 text-purple-500 animate-spin mb-3" />
                <p className="text-sm font-bold text-purple-700">Generating Insight...</p>
              </>
            ) : (
              <>
                <BarChart3 className="h-8 w-8 text-gray-300 mb-3" />
                <p className="text-xs text-gray-400">Insight not found. Try refreshing.</p>
                <button 
                  onClick={onRetry} 
                  className="mt-2 text-xs font-bold text-purple-600 underline hover:text-purple-800"
                >
                  Retry
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}