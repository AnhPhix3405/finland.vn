import { useAuthStore } from '@/src/store/authStore';
import { useNotificationStore } from '@/src/store/notificationStore';

/**
 * Fetch wrapper that handles 401 errors by:
 * 1. Attempting to refresh the token
 * 2. Retrying the request with new token
 * 3. If still fails, returns error
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit & { token?: string } = {}
): Promise<Response> {
  const { token, ...fetchOptions } = options;
  
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

  // If 401, attempt refresh and retry
  if (response.status === 401 && token) {
    console.log('🔄 Token expired, attempting refresh...');
    
    try {
      const refreshResponse = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const refreshResult = await refreshResponse.json();

      if (refreshResult.success && refreshResult.data?.access_token) {
        console.log('✓ Token refreshed successfully, retrying request...');
        
        // Update token in store
        useAuthStore.getState().updateAccessToken(refreshResult.data.access_token);

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
