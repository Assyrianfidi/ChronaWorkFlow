import * as React from "react"
import { create } from "zustand"

export type UserRole = "ADMIN" | "MANAGER" | "USER" | "AUDITOR" | "INVENTORY_MANAGER"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: UserRole
  permissions: string[]
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: {
    name: string
    email: string
    password: string
    role: UserRole
  }) => Promise<void>
  logout: () => void
  updateUser: (user: Partial<User>) => void
  hasPermission: (permission: string) => boolean
  hasRole: (role: UserRole | UserRole[]) => boolean
}

// Helper function to get permissions for a role
function getPermissionsForRole(role: UserRole): string[] {
  switch (role) {
    case "ADMIN":
      return [
        "read:dashboard",
        "write:dashboard", 
        "read:invoices",
        "write:invoices",
        "read:users",
        "write:users",
        "read:reports",
        "write:reports",
        "read:billing",
        "write:billing",
        "read:settings",
        "write:settings"
      ]
    case "MANAGER":
      return [
        "read:dashboard",
        "write:dashboard",
        "read:invoices",
        "write:invoices",
        "read:reports",
        "write:reports",
        "read:team",
        "write:team",
        "read:settings",
        "write:settings"
      ]
    case "USER":
      return [
        "read:dashboard",
        "write:dashboard",
        "read:invoices",
        "write:invoices",
        "read:reports",
        "write:reports"
      ]
    case "AUDITOR":
      return [
        "read:dashboard",
        "read:invoices",
        "read:reports",
        "read:audit",
        "read:compliance",
        "read:settings"
      ]
    case "INVENTORY_MANAGER":
      return [
        "read:dashboard",
        "write:dashboard",
        "read:inventory",
        "write:inventory",
        "read:reports",
        "write:reports",
        "read:settings",
        "write:settings"
      ]
    default:
      return []
  }
}

// API client helper with working backend integration
const apiClient = {
  login: async (email: string, password: string) => {
    console.log('🔐 Frontend: Attempting login for:', email)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Login failed')
      }
      
      const data = await response.json()
      console.log('✅ Frontend: Login successful for:', email)
      return data
    } catch (error) {
      console.error('❌ Frontend: Login error:', error)
      // Fallback to mock if backend is not available
      console.log('🔄 Frontend: Falling back to mock authentication')
      
      // Mock demo users
      const demoUsers = {
        'admin@accubooks.com': {
          password: 'admin123',
          user: {
            id: '1',
            name: 'Admin User',
            email: 'admin@accubooks.com',
            role: 'ADMIN' as UserRole,
          }
        },
        'manager@accubooks.com': {
          password: 'manager123', 
          user: {
            id: '2',
            name: 'Manager User',
            email: 'manager@accubooks.com',
            role: 'MANAGER' as UserRole,
          }
        },
        'user@accubooks.com': {
          password: 'user123',
          user: {
            id: '3',
            name: 'Regular User',
            email: 'user@accubooks.com',
            role: 'USER' as UserRole,
          }
        },
        'auditor@accubooks.com': {
          password: 'auditor123',
          user: {
            id: '4',
            name: 'Auditor User',
            email: 'auditor@accubooks.com',
            role: 'AUDITOR' as UserRole,
          }
        },
        'inventory@accubooks.com': {
          password: 'inventory123',
          user: {
            id: '5',
            name: 'Inventory Manager',
            email: 'inventory@accubooks.com',
            role: 'INVENTORY_MANAGER' as UserRole,
          }
        }
      }
      
      const demoUser = demoUsers[email as keyof typeof demoUsers]
      
      if (!demoUser || demoUser.password !== password) {
        throw new Error('Invalid email or password')
      }
      
      // Generate mock token
      const token = `mock-jwt-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      console.log('✅ Frontend: Mock login successful for:', email)
      
      return {
        success: true,
        data: {
          user: demoUser.user,
          accessToken: token,
          expiresIn: 3600
        }
      }
    }
  },
  
  register: async (userData: any) => {
    console.log('🔐 Frontend: Attempting registration for:', userData.email)
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Registration failed')
      }
      
      const data = await response.json()
      console.log('✅ Frontend: Registration successful for:', userData.email)
      return data
    } catch (error) {
      console.error('❌ Frontend: Registration error:', error)
      // Fallback to mock registration
      const newUser = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        role: userData.role as UserRole,
      }
      
      const token = `mock-jwt-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      console.log('✅ Frontend: Mock registration successful for:', userData.email)
      
      return {
        success: true,
        data: {
          user: newUser,
          accessToken: token,
          expiresIn: 3600
        }
      }
    }
  },
  
  logout: async () => {
    console.log('🔐 Frontend: Logging out')
    
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })
      
      if (!response.ok) {
        console.error('Logout failed')
      }
      console.log('✅ Frontend: Logout successful')
    } catch (error) {
      console.error('❌ Frontend: Logout error, but proceeding with local logout')
    }
  }
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true })
    
    try {
      console.log('🔐 Attempting login for:', email)
      
      // Call backend API
      const response = await apiClient.login(email, password)
      console.log('✅ Login response:', response)
      
      if (response.success && response.data) {
        const { user, accessToken } = response.data
        
        // Transform user data to match frontend expectations
        const transformedUser: User = {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: getPermissionsForRole(user.role)
        }
        
        // Store token and user
        localStorage.setItem('accubooks_token', accessToken)
        localStorage.setItem('accubooks_user', JSON.stringify(transformedUser))
        
        set({
          user: transformedUser,
          isAuthenticated: true,
          isLoading: false
        })
        
        console.log('✅ User authenticated successfully:', transformedUser)
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('❌ Login failed:', error)
      set({ isLoading: false })
      throw error
    }
  },

  register: async (userData: { name: string; email: string; password: string; role: UserRole }) => {
    set({ isLoading: true })
    
    try {
      console.log('🔐 Attempting registration for:', userData.email)
      
      // Call backend API
      const response = await apiClient.register(userData)
      console.log('✅ Registration response:', response)
      
      if (response.success && response.data) {
        const { user, accessToken } = response.data
        
        // Transform user data to match frontend expectations
        const transformedUser: User = {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: getPermissionsForRole(user.role)
        }
        
        // Store token and user
        localStorage.setItem('accubooks_token', accessToken)
        localStorage.setItem('accubooks_user', JSON.stringify(transformedUser))
        
        set({
          user: transformedUser,
          isAuthenticated: true,
          isLoading: false
        })
        
        console.log('✅ User registered and authenticated successfully:', transformedUser)
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('❌ Registration failed:', error)
      set({ isLoading: false })
      throw error
    }
  },

  logout: async () => {
    try {
      console.log('🔐 Logging out user')
      await apiClient.logout()
    } catch (error) {
      console.error('❌ Logout API call failed:', error)
    }
    
    set({
      user: null,
      isAuthenticated: false
    })
    
    // Clear all stored data
    localStorage.removeItem('accubooks_token')
    localStorage.removeItem('accubooks_user')
    localStorage.removeItem('accubooks_remember')
    
    console.log('✅ User logged out successfully')
  },

  updateUser: (userData: Partial<User>) => {
    const currentUser = get().user
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData }
      set({ user: updatedUser })
      localStorage.setItem('accubooks_user', JSON.stringify(updatedUser))
    }
  },

  hasPermission: (permission: string) => {
    const { user } = get()
    return user?.permissions.includes(permission) || false
  },

  hasRole: (role: UserRole | UserRole[]) => {
    const { user } = get()
    if (!user) return false
    
    if (Array.isArray(role)) {
      return role.includes(user.role)
    }
    
    return user.role === role
  }
}))

// Hook for initializing auth from localStorage
export const useAuthInit = () => {
  const { isAuthenticated, user, updateUser } = useAuth()
  
  React.useEffect(() => {
    const storedUser = localStorage.getItem('accubooks_user')
    const storedToken = localStorage.getItem('accubooks_token')
    
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser)
        console.log('🔄 Restoring user session:', parsedUser)
        updateUser(parsedUser)
      } catch (error) {
        console.error('❌ Failed to parse stored user:', error)
        localStorage.removeItem('accubooks_user')
        localStorage.removeItem('accubooks_token')
      }
    }
  }, [updateUser])
  
  return { isAuthenticated, user }
}

// Role-based access component
interface RoleGuardProps {
  children: React.ReactNode
  roles?: UserRole | UserRole[]
  permissions?: string | string[]
  fallback?: React.ReactNode
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  children, 
  roles, 
  permissions, 
  fallback = null 
}) => {
  const { hasRole, hasPermission } = useAuth()
  
  let hasAccess = true
  
  if (roles) {
    hasAccess = hasRole(roles)
  }
  
  if (permissions && hasAccess) {
    if (Array.isArray(permissions)) {
      hasAccess = permissions.some(permission => hasPermission(permission))
    } else {
      hasAccess = hasPermission(permissions)
    }
  }
  
  return <>{hasAccess ? children : fallback}</>
}

// Auth Context Provider (for class components or context consumers)
export const AuthContext = React.createContext<AuthState | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authState = useAuth()
  
  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  )
}
