'use client'; 

import { ReactNode } from 'react';
import BottomNav from '@/components/layout/BottomNav'; // 👈 Import Navigation
import CreateItemModal from '@/components/features/tracker/CreateItemModal'; // 👈 Import Unified Modal

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-md mx-auto w-full">
          <h1 className="font-bold text-lg tracking-tight">Life OS</h1>
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      {/* pb-24 ensures content isn't hidden behind the bottom nav */}
      <main className="flex-1 w-full max-w-md mx-auto p-4 pb-24">
        {children}
      </main>

      {/* NAVIGATION BAR (Includes the new FAB) */}
      <BottomNav />

      {/* MODALS */}
      <CreateItemModal />
      
    </div>
  );
}