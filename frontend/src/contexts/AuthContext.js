import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
const AuthContext = createContext(undefined);
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        // Check for existing JWT token on mount
        const token = localStorage.getItem('jwt_token');
        if (token) {
            // Validate token with backend
            validateToken(token);
        }
        else {
            setIsLoading(false);
        }
    }, []);
    const validateToken = async (token) => {
        try {
            const response = await fetch('http://localhost:3000/auth/validate', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            }
            else {
                localStorage.removeItem('jwt_token');
            }
        }
        catch (error) {
            console.error('Token validation failed:', error);
            localStorage.removeItem('jwt_token');
        }
        finally {
            setIsLoading(false);
        }
    };
    const login = async (email, password) => {
        try {
            const response = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
            if (response.ok) {
                const { user: userData, token } = await response.json();
                localStorage.setItem('jwt_token', token);
                setUser(userData);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Login failed:', error);
            return false;
        }
    };
    const logout = () => {
        localStorage.removeItem('jwt_token');
        setUser(null);
    };
    const value = {
        user,
        login,
        logout,
        isLoading,
        isAuthenticated: !!user,
    };
    return _jsx(AuthContext.Provider, { value: value, children: children });
};
