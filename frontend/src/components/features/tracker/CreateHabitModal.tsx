'use client';

import { useState } from 'react';
import { useCreateHabit } from '@/hooks/queries/useTracker';
import { useUIStore } from '@/hooks/stores/useUIStore';
import { X, Loader2 } from 'lucide-react';

export default function CreateHabitModal() {
  const { isGlobalAddOpen, toggleGlobalAdd } = useUIStore();
  const createHabit = useCreateHabit();
  
  const [name, setName] = useState('');
  const [type, setType] = useState<'BUILD' | 'QUIT'>('BUILD');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    await createHabit.mutateAsync({
      name,
      habit_type: type,
      frequency: 'DAILY',
      tracking_mode: 'BINARY',
      config: {},
    });

    // Reset and Close
    setName('');
    toggleGlobalAdd();
  };

  if (!isGlobalAddOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-10">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">New Habit</h2>
          <button onClick={toggleGlobalAdd} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">I want to...</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('BUILD')}
                className={`p-2 text-sm font-medium rounded-lg border ${
                  type === 'BUILD' 
                    ? 'bg-green-50 border-green-200 text-green-700' 
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                Build a Habit
              </button>
              <button
                type="button"
                onClick={() => setType('QUIT')}
                className={`p-2 text-sm font-medium rounded-lg border ${
                  type === 'QUIT' 
                    ? 'bg-red-50 border-red-200 text-red-700' 
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                Quit a Habit
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Read 10 pages, No Sugar..."
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={createHabit.isPending}
            className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {createHabit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Habit
          </button>
        </form>
      </div>
    </div>
  );
}