import { useAuthStore } from '@/src/store/authStore';
import { useAdminStore } from '@/src/store/adminStore';
import { useNotificationStore } from '@/src/store/notificationStore';

/**
 * Fetch wrapper that handles 401 errors by:
 * 1. Attempting to refresh the token
 * 2. Retrying the request with new token
 * 3. If still fails, returns error
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit & { token?: string; isAdmin?: boolean } = {}
): Promise<Response> {
  const { token, isAdmin = false, ...fetchOptions } = options;
  
  // Set authorization header if token provided
  const headers = {
    ...fetchOptions.headers,
    ...(token && { 'Authorization': `Bearer ${token}` })
  } as Record<string, string>;

  if (Object.keys(headers).length > 0) {
    fetchOptions.headers = headers;
  }

  // First attempt
  let response = await fetch(url, fetchOptions);

  // If 401, attempt refresh and retry (regardless of whether token exists)
  if (response.status === 401) {
    console.log('🔄 Token expired or missing, attempting refresh...');
    
    try {
      // Wait 1-2 seconds before retrying to avoid jittery behavior
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Use appropriate refresh endpoint (admin vs user)
      const refreshEndpoint = isAdmin ? '/api/admin/refresh-token' : '/api/auth/refresh-token';
      
      const refreshResponse = await fetch(refreshEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const refreshResult = await refreshResponse.json();

      if (refreshResult.success && refreshResult.data?.access_token) {
        console.log('✓ Token refreshed successfully, retrying request...');
        
        // Update token in appropriate store
        if (isAdmin) {
          useAdminStore.getState().updateAccessToken(refreshResult.data.access_token);
        } else {
          useAuthStore.getState().updateAccessToken(refreshResult.data.access_token);
        }

        // Retry request with new token
        const retryHeaders = {
          ...fetchOptions.headers,
          'Authorization': `Bearer ${refreshResult.data.access_token}`
        };

        response = await fetch(url, {
          ...fetchOptions,
          headers: retryHeaders
        });
      } else {
        console.error('❌ Token refresh failed');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  }

  return response;
}

/**
 * Handle API error and show toast
 */
export function handleApiError(error: unknown, defaultMessage: string = 'Lỗi kết nối') {
  console.error('API Error:', error);
  
  let message = defaultMessage;
  if (error instanceof Error) {
    message = error.message;
  }
  
  useNotificationStore.getState().addToast(message, 'error');
  return { success: false, error: message };
}

/**
 * Redirect to login page
 */
export function redirectToLogin() {
  // Clear auth store
  useAuthStore.getState().clearAuth();
  
  // Redirect to login
  if (typeof window !== 'undefined') {
    window.location.href = '/dang-nhap';
  }
}
