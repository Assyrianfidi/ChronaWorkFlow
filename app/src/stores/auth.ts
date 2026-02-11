import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { User, Company, AuthTokens, LoginCredentials, RegisterData } from '@/types';

interface AuthState {
  // State
  user: User | null;
  companies: Company[];
  currentCompany: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  requiresMFA: boolean;
  tempToken: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  verifyMFA: (code: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  switchCompany: (companyId: string) => Promise<void>;
  fetchCompanies: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      companies: [],
      currentCompany: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      requiresMFA: false,
      tempToken: null,

      // Login action
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<{ user: User; tokens: AuthTokens; companies: Company[]; requiresMFA?: boolean; tempToken?: string }>(
            API_ENDPOINTS.auth.login,
            credentials
          );
          
          if (response.requiresMFA && response.tempToken) {
            set({ 
              requiresMFA: true, 
              tempToken: response.tempToken,
              isLoading: false 
            });
            return;
          }
          
          // Store tokens in cookies (httpOnly would be better from server)
          Cookies.set('access_token', response.tokens.access_token, { 
            secure: true, 
            sameSite: 'strict',
            expires: response.tokens.expires_in / 86400 // Convert seconds to days
          });
          Cookies.set('refresh_token', response.tokens.refresh_token, { 
            secure: true, 
            sameSite: 'strict',
            expires: 30 // 30 days
          });
          
          const currentCompany = response.companies[0] || null;
          if (currentCompany) {
            Cookies.set('current_company_id', currentCompany.id, { 
              secure: true, 
              sameSite: 'strict',
              expires: 30
            });
          }
          
          set({
            user: response.user,
            companies: response.companies,
            currentCompany,
            isAuthenticated: true,
            isLoading: false,
            requiresMFA: false,
            tempToken: null,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false 
          });
          throw error;
        }
      },

      // Verify MFA
      verifyMFA: async (code) => {
        const { tempToken } = get();
        if (!tempToken) {
          throw new Error('No MFA token available');
        }
        
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<{ user: User; tokens: AuthTokens; companies: Company[] }>(
            API_ENDPOINTS.auth.mfa.verify,
            { code, temp_token: tempToken }
          );
          
          Cookies.set('access_token', response.tokens.access_token, { 
            secure: true, 
            sameSite: 'strict',
            expires: response.tokens.expires_in / 86400
          });
          Cookies.set('refresh_token', response.tokens.refresh_token, { 
            secure: true, 
            sameSite: 'strict',
            expires: 30
          });
          
          const currentCompany = response.companies[0] || null;
          if (currentCompany) {
            Cookies.set('current_company_id', currentCompany.id, { 
              secure: true, 
              sameSite: 'strict',
              expires: 30
            });
          }
          
          set({
            user: response.user,
            companies: response.companies,
            currentCompany,
            isAuthenticated: true,
            isLoading: false,
            requiresMFA: false,
            tempToken: null,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'MFA verification failed',
            isLoading: false 
          });
          throw error;
        }
      },

      // Register action
      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<{ user: User; tokens: AuthTokens; company: Company }>(
            API_ENDPOINTS.auth.register,
            data
          );
          
          Cookies.set('access_token', response.tokens.access_token, { 
            secure: true, 
            sameSite: 'strict',
            expires: response.tokens.expires_in / 86400
          });
          Cookies.set('refresh_token', response.tokens.refresh_token, { 
            secure: true, 
            sameSite: 'strict',
            expires: 30
          });
          Cookies.set('current_company_id', response.company.id, { 
            secure: true, 
            sameSite: 'strict',
            expires: 30
          });
          
          set({
            user: response.user,
            companies: [response.company],
            currentCompany: response.company,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false 
          });
          throw error;
        }
      },

      // Logout action
      logout: async () => {
        try {
          await api.post(API_ENDPOINTS.auth.logout);
        } catch (error) {
          // Ignore logout errors
        } finally {
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
          Cookies.remove('current_company_id');
          
          set({
            user: null,
            companies: [],
            currentCompany: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            requiresMFA: false,
            tempToken: null,
          });
        }
      },

      // Fetch current user
      fetchUser: async () => {
        const token = Cookies.get('access_token');
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }
        
        set({ isLoading: true });
        try {
          const user = await api.get<User>(API_ENDPOINTS.auth.me);
          set({ user, isAuthenticated: true, isLoading: false });
          
          // Also fetch companies
          await get().fetchCompanies();
        } catch (error) {
          set({ 
            isAuthenticated: false, 
            isLoading: false,
            user: null 
          });
        }
      },

      // Switch company
      switchCompany: async (companyId) => {
        set({ isLoading: true });
        try {
          await api.post(API_ENDPOINTS.companies.switch, { company_id: companyId });
          Cookies.set('current_company_id', companyId, { 
            secure: true, 
            sameSite: 'strict',
            expires: 30
          });
          
          const { companies } = get();
          const company = companies.find(c => c.id === companyId) || null;
          set({ currentCompany: company, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to switch company',
            isLoading: false 
          });
          throw error;
        }
      },

      // Fetch companies
      fetchCompanies: async () => {
        try {
          const companies = await api.get<Company[]>(API_ENDPOINTS.companies.list);
          const currentCompanyId = Cookies.get('current_company_id');
          const currentCompany = companies.find(c => c.id === currentCompanyId) || companies[0] || null;
          
          set({ companies, currentCompany });
        } catch (error) {
          console.error('Failed to fetch companies:', error);
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'chronaworkflow-auth',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
