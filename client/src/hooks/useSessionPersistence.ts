import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api';

/**
 * Hook to restore user session on app load
 * Checks localStorage for token and validates with backend
 */
export function useSessionPersistence() {
  const auth = useAuth();

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('accubooks_token');
      
      if (!token) {
        return;
      }

      try {
        // Validate token with backend
        const response = await authApi.getMe();
        const userData = response?.data?.data ?? response?.data;

        if (userData?.id) {
          // Token is valid, user data returned
          // Auth state already hydrated from localStorage
          // Just verify it's still valid
          console.log('Session restored successfully');
        }
      } catch (error) {
        // Token invalid or expired
        console.error('Session restoration failed:', error);
        localStorage.removeItem('accubooks_token');
        localStorage.removeItem('accubooks_user');
        auth.logout();
      }
    };

    restoreSession();
  }, []);

  return auth;
}
