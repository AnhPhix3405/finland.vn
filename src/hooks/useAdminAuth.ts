import { useEffect, useRef } from 'react';
import { useAdminStore } from '@/src/store/adminStore';

export function useAdminAuth(onAuthFailed?: () => void) {
  const initialized = useRef(false);
  const adminToken = useAdminStore((state) => state.accessToken);
  const updateAccessToken = useAdminStore((state) => state.updateAccessToken);
  const clearAuth = useAdminStore((state) => state.clearAuth);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initAuth = async () => {
      if (adminToken) return;

      try {
        const refreshResponse = await fetch('/api/admin/refresh-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await refreshResponse.json();
        
        if (result.success && result.data?.access_token) {
          console.log('✓ Auto-refreshed admin token on mount');
          updateAccessToken(result.data.access_token);
        } else {
          console.log('❌ Auto-refresh failed, redirecting to login');
          clearAuth();
          onAuthFailed?.();
        }
      } catch (error) {
        console.error('Error during admin auth init:', error);
        clearAuth();
        onAuthFailed?.();
      }
    };

    initAuth();
  }, [adminToken, updateAccessToken, clearAuth, onAuthFailed]);

  return { adminToken, isAuthenticated: !!adminToken };
}
