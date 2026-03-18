/**
 * Auth Service for Frontend
 * Handles communication with Broker Auth APIs and updates Zustand stores
 */
import { useAuthStore } from "@/src/store/authStore";
import { useUserStore } from "@/src/store/userStore";
import { useAdminStore } from "@/src/store/adminStore";

export const registerBroker = async (data: Record<string, unknown>) => {
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        console.log('🔹 [AUTH] Register API result:', result);

        // If registration returns tokens (auto-login), update stores
        if (result.success && result.data?.access_token) {
            const { access_token, ...userData } = result.data;
            console.log('🔹 [AUTH] Setting user with data:', userData);
            useAuthStore.getState().setAuth(access_token);
            useUserStore.getState().setUser(userData);
        }

        return result;
    } catch (error) {
        console.error('Frontend register error:', error);
        return { success: false, error: 'Không thể kết nối đến máy chủ' };
    }
};

export const loginBroker = async (phone: string, password: string) => {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phone, password }),
        });
        const result = await response.json();

        if (result.success) {
            const { access_token, ...userData } = result.data;
            useAuthStore.getState().setAuth(access_token);
            useUserStore.getState().setUser(userData);
        }

        return result;
    } catch (error) {
        console.error('Frontend login error:', error);
        return { success: false, error: 'Không thể kết nối đến máy chủ' };
    }
};

export const refreshTokenBroker = async () => {
    try {
        const response = await fetch('/api/auth/refresh-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const result = await response.json();

        if (result.success && result.data?.access_token) {
            useAuthStore.getState().updateAccessToken(result.data.access_token);
        }

        return result;
    } catch (error) {
        console.error('Frontend refresh token error:', error);
        return { success: false, error: 'Không thể kết nối đến máy chủ' };
    }
};

export const logoutBroker = () => {
    useAuthStore.getState().clearAuth();
    useUserStore.getState().clearUser();
    document.cookie = 'refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
};

// Admin Authentication Functions
export const loginAdmin = async (email: string, password: string) => {
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        const result = await response.json();

        if (result.success) {
            const { access_token, ...userData } = result.data;
            useAdminStore.getState().setAuth(access_token);
        }

        return result;
    } catch (error) {
        console.error('Frontend admin login error:', error);
        return { success: false, error: 'Không thể kết nối đến máy chủ' };
    }
};

export const initFirstAdmin = async (data: { email: string; name: string; password: string }) => {
    try {
        const response = await fetch('/api/admin/init', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Frontend admin init error:', error);
        return { success: false, error: 'Không thể kết nối đến máy chủ' };
    }
};

export const logoutAdmin = () => {
    useAdminStore.getState().clearAuth();
    // Clear admin-specific cookie
    document.cookie = 'admin-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
};

export const refreshAdminToken = async () => {
    try {
        const response = await fetch('/api/admin/refresh-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const result = await response.json();

        if (result.success && result.data?.access_token) {
            useAdminStore.getState().updateAccessToken(result.data.access_token);
        }

        return result;
    } catch (error) {
        console.error('Frontend admin refresh token error:', error);
        return { success: false, error: 'Không thể kết nối đến máy chủ' };
    }
};
