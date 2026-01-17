import { create } from 'zustand';
import { startOfToday } from 'date-fns';

interface UIStore {
  // The date currently being viewed in the dashboard
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  
  // Controls for the Global "Add" modal (Future proofing)
  isGlobalAddOpen: boolean;
  toggleGlobalAdd: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  selectedDate: startOfToday(), // Default to today
  setSelectedDate: (date) => set({ selectedDate: date }),
  
  isGlobalAddOpen: false,
  toggleGlobalAdd: () => set((state) => ({ isGlobalAddOpen: !state.isGlobalAddOpen })),
}));