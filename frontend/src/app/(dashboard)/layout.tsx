'use client'; // <--- Turn this into a Client Component

import { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { useUIStore } from '@/hooks/stores/useUIStore';
import CreateHabitModal from '@/components/features/tracker/CreateHabitModal';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { toggleGlobalAdd } = useUIStore();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-lg mx-auto w-full">
          <h1 className="font-bold text-lg">Life OS</h1>
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full max-w-lg mx-auto p-4 pb-24">
        {children}
      </main>

      {/* FLOATING ACTION BUTTON (FAB) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={toggleGlobalAdd}
          className="h-14 w-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* MODALS */}
      <CreateHabitModal />
    </div>
  );
}