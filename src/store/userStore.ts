import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
    id: string;
    full_name: string;
    phone: string;
    email?: string;
    avatar_url?: string;
    specialization?: string;
    bio?: string;
    is_active: boolean;
    province?: string;
    ward?: string;
    referrer_phone?: string;
    created_at?: string | Date;
    updated_at?: string | Date;
    role?: 'broker' | 'admin';
}

interface UserState {
    user: User | null;
    setUser: (user: User) => void;
    clearUser: () => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            user: null,
            setUser: (user) => set({ user }),
            clearUser: () => set({ user: null }),
        }),
        {
            name: 'user-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
