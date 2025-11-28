import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authApi } from '../api';

// Enhanced User Types with Role Adaptivity
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'beginner' | 'professional' | 'admin' | 'super_admin';
  isActive?: boolean;
  permissions?: Permission[];
  preferences?: UserPreferences;
  subscriptionTier?: 'basic' | 'professional' | 'enterprise';
  lastLogin?: Date;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  notifications: NotificationSettings;
  dashboard: DashboardSettings;
  shortcuts: Record<string, string>;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  desktop: boolean;
  types: {
    transactions: boolean;
    invoices: boolean;
    reports: boolean;
    system: boolean;
  };
}

export interface DashboardSettings {
  layout: 'grid' | 'list';
  widgets: string[];
  refreshInterval: number;
  defaultView: 'overview' | 'detailed';
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: Permission[];
  roleFeatures: RoleFeatures;
}

export interface RoleFeatures {
  canViewAdvancedReports: boolean;
  canManageUsers: boolean;
  canAccessAPI: boolean;
  canCustomizeDashboard: boolean;
  canExportData: boolean;
  canManageIntegrations: boolean;
  canAccessAuditLogs: boolean;
  canManageBilling: boolean;
  maxAccounts: number;
  maxTransactions: number;
  advancedFeatures: string[];
}

// Enhanced Auth actions
export type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; accessToken: string; refreshToken: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'SET_PERMISSIONS'; payload: Permission[] }
  | { type: 'UPDATE_ROLE_FEATURES'; payload: Partial<RoleFeatures> };

// Initial state
const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: false,
  isLoading: false,
  error: null,
  permissions: [],
  roleFeatures: {
    canViewAdvancedReports: false,
    canManageUsers: false,
    canAccessAPI: false,
    canCustomizeDashboard: false,
    canExportData: false,
    canManageIntegrations: false,
    canAccessAuditLogs: false,
    canManageBilling: false,
    maxAccounts: 10,
    maxTransactions: 1000,
    advancedFeatures: []
  }
};

// Enhanced Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      if (!action.payload.user) {
        return state;
      }
      const roleFeatures = getRoleFeatures(action.payload.user.role);
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        roleFeatures,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        permissions: [],
        roleFeatures: initialState.roleFeatures,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        permissions: [],
        roleFeatures: initialState.roleFeatures,
      };
    case 'REFRESH_TOKEN':
      return {
        ...state,
        accessToken: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { 
          ...state.user, 
          ...action.payload,
          preferences: action.payload.preferences ? {
            ...state.user.preferences,
            ...action.payload.preferences
          } : state.user.preferences
        } : null,
      };
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        user: state.user ? { 
          ...state.user, 
          preferences: { ...state.user.preferences, ...action.payload }
        } : null,
      };
    case 'SET_PERMISSIONS':
      return {
        ...state,
        permissions: action.payload,
      };
    case 'UPDATE_ROLE_FEATURES':
      return {
        ...state,
        roleFeatures: { ...state.roleFeatures, ...action.payload },
      };
    default:
      return state;
  }
};

// Role-based feature mapping
const getRoleFeatures = (role: User['role']): RoleFeatures => {
  switch (role) {
    case 'beginner':
      return {
        canViewAdvancedReports: false,
        canManageUsers: false,
        canAccessAPI: false,
        canCustomizeDashboard: false,
        canExportData: true,
        canManageIntegrations: false,
        canAccessAuditLogs: false,
        canManageBilling: false,
        maxAccounts: 10,
        maxTransactions: 1000,
        advancedFeatures: ['basic_reports', 'simple_dashboard']
      };
    case 'professional':
      return {
        canViewAdvancedReports: true,
        canManageUsers: false,
        canAccessAPI: true,
        canCustomizeDashboard: true,
        canExportData: true,
        canManageIntegrations: true,
        canAccessAuditLogs: false,
        canManageBilling: false,
        maxAccounts: 100,
        maxTransactions: 10000,
        advancedFeatures: ['advanced_reports', 'custom_dashboard', 'api_access', 'integrations']
      };
    case 'admin':
      return {
        canViewAdvancedReports: true,
        canManageUsers: true,
        canAccessAPI: true,
        canCustomizeDashboard: true,
        canExportData: true,
        canManageIntegrations: true,
        canAccessAuditLogs: true,
        canManageBilling: true,
        maxAccounts: 1000,
        maxTransactions: 100000,
        advancedFeatures: ['advanced_reports', 'custom_dashboard', 'api_access', 'integrations', 'user_management', 'audit_logs', 'billing']
      };
    case 'super_admin':
      return {
        canViewAdvancedReports: true,
        canManageUsers: true,
        canAccessAPI: true,
        canCustomizeDashboard: true,
        canExportData: true,
        canManageIntegrations: true,
        canAccessAuditLogs: true,
        canManageBilling: true,
        maxAccounts: -1, // Unlimited
        maxTransactions: -1, // Unlimited
        advancedFeatures: ['all_features']
      };
    default:
      return initialState.roleFeatures;
  }
};

// Context
const AuthContext = createContext<{
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  hasPermission: (resource: string, action: string) => boolean;
  canAccessFeature: (feature: string) => boolean;
} | null>(null);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Login function
  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authApi.login(email, password);
      const { user, accessToken, refreshToken } = response.data.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, accessToken, refreshToken }
      });
    } catch (error: any) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.response?.data?.message || 'Login failed'
      });
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    dispatch({ type: 'LOGOUT' });
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      const response = await authApi.refresh(state.refreshToken!);
      const { accessToken } = response.data.data;
      
      localStorage.setItem('accessToken', accessToken);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { 
          user: state.user!, 
          accessToken, 
          refreshToken: state.refreshToken! 
        }
      });
    } catch (error) {
      logout();
    }
  };

  // Update user function
  const updateUser = (userData: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  // Update preferences function
  const updatePreferences = (preferences: Partial<UserPreferences>) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
  };

  // Permission check function
  const hasPermission = (resource: string, action: string): boolean => {
    return state.permissions.some(
      permission => permission.resource === resource && permission.action === action
    );
  };

  // Feature access check function
  const canAccessFeature = (feature: string): boolean => {
    return state.roleFeatures.advancedFeatures.includes(feature) || 
           state.roleFeatures.advancedFeatures.includes('all_features');
  };

  // Effect for token refresh
  useEffect(() => {
    if (state.isAuthenticated && state.accessToken && process.env.NODE_ENV !== 'test') {
      try {
        const tokenParts = state.accessToken.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Invalid token format');
        }
        const tokenExpiry = JSON.parse(atob(tokenParts[1])).exp * 1000;
        const timeUntilExpiry = tokenExpiry - Date.now();
        
        if (timeUntilExpiry > 0) {
          const timeout = setTimeout(refreshToken, timeUntilExpiry - 5 * 60 * 1000); // 5 minutes before expiry
          return () => clearTimeout(timeout);
        } else {
          refreshToken();
        }
      } catch (error) {
        // Invalid token, logout
        logout();
      }
    }
  }, [state.isAuthenticated, state.accessToken]);

  return (
    <AuthContext.Provider
      value={{
        state,
        login,
        logout,
        refreshToken,
        updateUser,
        updatePreferences,
        hasPermission,
        canAccessFeature,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
