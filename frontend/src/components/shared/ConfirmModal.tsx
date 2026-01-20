'use client';

import { useUIStore } from '@/hooks/stores/useUIStore';
import { Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ConfirmModal() {
  const { confirmConfig, closeConfirm } = useUIStore();
  const { isOpen, title, message, actionLabel, onConfirm, isLoading } = confirmConfig;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex border-t bg-gray-50/50">
          <button 
            onClick={closeConfirm}
            disabled={isLoading}
            className="flex-1 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <div className="w-px bg-gray-200"></div>
          <button 
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}