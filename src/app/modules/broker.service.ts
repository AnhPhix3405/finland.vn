/**
 * Broker Service for Frontend
 * Handles communication with Broker APIs and updates user store
 */
import { useUserStore } from "@/src/store/userStore";
import { useAuthStore } from "@/src/store/authStore";
import { fetchWithRetry } from "@/src/lib/api/fetch-with-retry";

export interface UpdateBrokerData {
  full_name?: string;
  email?: string;
  province?: string;
  ward?: string;
  address?: string;
  bio?: string;
  avatar_url?: string;
}

export const updateBroker = async (phone: string, data: UpdateBrokerData, brokerId?: string) => {
  try {
    const accessToken = useAuthStore.getState().accessToken;
    
    if (!accessToken) {
      return { success: false, error: 'Bạn cần đăng nhập' };
    }

    const response = await fetchWithRetry('/api/brokers', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: brokerId,
        phone,
        ...data,
      }),
      token: accessToken,
      isAdmin: false,
    });
    
    const result = await response.json();

    if (result.success) {
      // Update user store with new data
      const currentUser = useUserStore.getState().user;
      if (currentUser) {
        useUserStore.getState().setUser({
          ...currentUser,
          ...result.data,
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Frontend update broker error:', error);
    return { success: false, error: 'Không thể kết nối đến máy chủ' };
  }
};

export const getBroker = async (phone: string) => {
  try {
    const response = await fetch(`/api/brokers/${phone}`);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Frontend get broker error:', error);
    return { success: false, error: 'Không thể kết nối đến máy chủ' };
  }
};
