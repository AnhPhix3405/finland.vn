import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

interface NotificationStore {
  toasts: Toast[];
  addToast: (message: string, type: 'success' | 'error' | 'info', duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  toasts: [],
  
  addToast: (message: string, type: 'success' | 'error' | 'info', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: Toast = { id, message, type, duration };
    
    set((state) => ({
      toasts: [...state.toasts, toast]
    }));

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter(t => t.id !== id)
        }));
      }, duration);
    }
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter(t => t.id !== id)
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  }
}));
