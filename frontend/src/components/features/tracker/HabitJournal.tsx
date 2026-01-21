import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertCircle, FileText } from 'lucide-react';
import { Habit } from '@/types';

export default function HabitJournal({ habit }: { habit: Habit }) {
  const logs = (habit.logs || []).sort((a, b) => b.date.localeCompare(a.date)); // Newest first

  if (logs.length === 0) {
    return (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400 text-sm">No logs recorded yet.</p>
        </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50/50 border-b">
            <h3 className="text-xs font-bold text-gray-500 uppercase">History Log</h3>
        </div>
        <div className="divide-y">
            {logs.map((log) => {
                const date = parseISO(log.date);
                const isSuccess = ['DONE', 'RESISTED'].includes(log.status);
                const isMissed = ['MISSED', 'FAILED'].includes(log.status);

                return (
                    <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors flex gap-4">
                        {/* Date Column */}
                        <div className="flex flex-col items-center min-w-[3rem]">
                            <span className="text-xs font-bold text-gray-900 uppercase">{format(date, 'MMM')}</span>
                            <span className="text-xl font-black text-gray-900 leading-none">{format(date, 'd')}</span>
                            <span className="text-[10px] text-gray-400 uppercase mt-1">{format(date, 'EEE')}</span>
                        </div>

                        {/* Status Icon */}
                        <div className="pt-1">
                            {isSuccess && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                            {isMissed && <XCircle className="h-5 w-5 text-red-400" />}
                            {log.status === 'PARTIAL' && <AlertCircle className="h-5 w-5 text-yellow-500" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-1">
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "text-sm font-bold",
                                    isSuccess ? "text-green-700" : isMissed ? "text-red-700" : "text-yellow-700"
                                )}>
                                    {log.status}
                                </span>
                                {log.entry_value && (
                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono font-medium text-gray-600">
                                        {log.entry_value}
                                    </span>
                                )}
                            </div>
                            
                            {/* Notes */}
                            {log.note && (
                                <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg flex items-start gap-2 border border-gray-100">
                                    <FileText className="h-3 w-3 text-gray-400 mt-1 shrink-0" />
                                    <span className="italic">"{log.note}"</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
}