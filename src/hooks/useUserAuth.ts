import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/src/store/authStore';

export function useUserAuth(onAuthFailed?: () => void) {
  const initialized = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const userToken = useAuthStore((state) => state.accessToken);
  const updateAccessToken = useAuthStore((state) => state.updateAccessToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initAuth = async () => {
      setIsLoading(true);
      
      if (userToken) {
        setIsLoading(false);
        return;
      }

      try {
        const refreshResponse = await fetch('/api/auth/refresh-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await refreshResponse.json();
        
        if (result.success && result.data?.access_token) {
          console.log('✓ Auto-refreshed user token on mount');
          updateAccessToken(result.data.access_token);
        } else {
          console.log('❌ Auto-refresh failed, redirecting to login');
          clearAuth();
          onAuthFailed?.();
        }
      } catch (error) {
        console.error('Error during user auth init:', error);
        clearAuth();
        onAuthFailed?.();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [userToken, updateAccessToken, clearAuth, onAuthFailed]);

  return { userToken, isAuthenticated: !!userToken, isLoading };
}
