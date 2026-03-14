/**
 * Broker Service for Frontend
 * Handles communication with Broker APIs and updates user store
 */
import { useUserStore } from "@/src/store/userStore";

export interface UpdateBrokerData {
  full_name?: string;
  email?: string;
  province?: string;
  ward?: string;
  specialization?: string;
  bio?: string;
  avatar_url?: string;
}

export const updateBroker = async (phone: string, data: UpdateBrokerData) => {
  try {
    const response = await fetch('/api/brokers', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        ...data,
      }),
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
