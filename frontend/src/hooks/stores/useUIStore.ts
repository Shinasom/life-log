import { create } from 'zustand';

interface UIStore {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  
  // --- CREATE / EDIT MODAL STATE ---
  isCreateModalOpen: boolean; // Renamed from isGlobalAddOpen for clarity
  activeModalType: 'HABIT' | 'GOAL' | null; // Renamed from editType
  itemToEdit: any | null; 
  
  // Actions
  openCreateModal: (type?: 'HABIT' | 'GOAL') => void;
  openEditModal: (type: 'HABIT' | 'GOAL', item: any) => void;
  closeCreateModal: () => void;

  // --- CONFIRM MODAL STATE ---
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

export const useUIStore = create<UIStore>((set) => ({
  selectedDate: new Date(),
  setSelectedDate: (date) => set({ selectedDate: date }),
  
  // Initial State
  isCreateModalOpen: false,
  activeModalType: null,
  itemToEdit: null,

  // Open for CREATING (Reset edit data)
  openCreateModal: (type) => set({ 
    isCreateModalOpen: true, 
    activeModalType: type || 'HABIT',
    itemToEdit: null 
  }),

  // Open for EDITING (Load item data)
  openEditModal: (type, item) => set({
    isCreateModalOpen: true,
    activeModalType: type,
    itemToEdit: item
  }),

  // Close Modal
  closeCreateModal: () => set({ 
    isCreateModalOpen: false,
    activeModalType: null,
    itemToEdit: null 
  }),

  // --- CONFIRM LOGIC (Kept as is) ---
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