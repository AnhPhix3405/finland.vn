import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
    accessToken: string | null;
    isAuthenticated: boolean;
    isHydrated: boolean;
    setAuth: (accessToken: string) => void;
    clearAuth: () => void;
    updateAccessToken: (accessToken: string) => void;
    setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            accessToken: null,
            isAuthenticated: false,
            isHydrated: false,
            setAuth: (accessToken) =>
                set({
                    accessToken,
                    isAuthenticated: true
                }),
            clearAuth: () =>
                set({
                    accessToken: null,
                    isAuthenticated: false
                }),
            updateAccessToken: (accessToken) =>
                set({
                    accessToken
                }),
            setHydrated: (hydrated) =>
                set({
                    isHydrated: hydrated
                })
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                // Called after hydration is complete
                if (state) {
                    state.isHydrated = true;
                    console.log('✓ AuthStore hydrated from localStorage:', {
                        hasToken: !!state.accessToken,
                        isAuthenticated: state.isAuthenticated,
                        isHydrated: true
                    });
                }
            }
        }
    )
);
