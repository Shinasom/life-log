import { create } from 'zustand';

interface UIStore {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  
  // Create/Edit Modal State
  isGlobalAddOpen: boolean;
  itemToEdit: any | null; 
  editType: 'HABIT' | 'GOAL' | null;
  toggleGlobalAdd: () => void;
  openEditModal: (type: 'HABIT' | 'GOAL', item: any) => void;

  // 👇 NEW: Confirm Modal State
  confirmConfig: {
    isOpen: boolean;
    title: string;
    message: string;
    actionLabel: string;
    onConfirm: () => void;
    isLoading: boolean;
  };
  openConfirm: (config: { title: string; message: string; actionLabel?: string; onConfirm: () => Promise<void> | void }) => void;
  closeConfirm: () => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  selectedDate: new Date(),
  setSelectedDate: (date) => set({ selectedDate: date }),
  
  isGlobalAddOpen: false,
  itemToEdit: null,
  editType: null,

  toggleGlobalAdd: () => set((state) => ({ 
    isGlobalAddOpen: !state.isGlobalAddOpen,
    itemToEdit: null,
    editType: null 
  })),

  openEditModal: (type, item) => set({
    isGlobalAddOpen: true,
    editType: type,
    itemToEdit: item
  }),

  // 👇 NEW: Confirm Logic
  confirmConfig: {
    isOpen: false,
    title: '',
    message: '',
    actionLabel: 'Confirm',
    onConfirm: () => {},
    isLoading: false,
  },

  openConfirm: ({ title, message, actionLabel = 'Confirm', onConfirm }) => set({
    confirmConfig: {
      isOpen: true,
      title,
      message,
      actionLabel,
      onConfirm: async () => {
        set((s) => ({ confirmConfig: { ...s.confirmConfig, isLoading: true } }));
        await onConfirm();
        set((s) => ({ confirmConfig: { ...s.confirmConfig, isOpen: false, isLoading: false } }));
      },
      isLoading: false
    }
  }),

  closeConfirm: () => set((state) => ({ 
    confirmConfig: { ...state.confirmConfig, isOpen: false } 
  })),
}));