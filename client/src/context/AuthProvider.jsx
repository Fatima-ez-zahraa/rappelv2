import React, { createContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const storedUser = localStorage.getItem('rappel_user');
                const token = localStorage.getItem('rappel_token');

                if (token) {
                    try {
                        // Try to get fresh user data from backend
                        const data = await api.auth.getProfile();
                        setUser(data);
                        localStorage.setItem('rappel_user', JSON.stringify(data));
                    } catch (error) {
                        console.error('Failed to sync profile:', error);
                        if (storedUser) {
                            setUser(JSON.parse(storedUser));
                        }
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    const refreshUser = async () => {
        try {
            const data = await api.auth.getProfile();
            const userData = data.user || data;
            setUser(userData);
            localStorage.setItem('rappel_user', JSON.stringify(userData));
            return userData;
        } catch (error) {
            console.error('Refresh user error:', error);
            throw error;
        }
    };

    // Actions
    const signup = async (userData) => {
        const data = await api.auth.signup(userData);
        setUser(data.user);
        localStorage.setItem('rappel_user', JSON.stringify(data.user));
        return data;
    };

    const login = async (email, password) => {
        const data = await api.auth.login(email, password);
        setUser(data.user);
        localStorage.setItem('rappel_user', JSON.stringify(data.user));
        return data;
    };

    const logout = async () => {
        api.auth.logout();
        setUser(null);
        localStorage.removeItem('rappel_user');
    };

    const verifyEmail = async (code) => {
        await api.auth.verify(code);
        const updatedUser = { ...user, is_verified: true };
        setUser(updatedUser);
        localStorage.setItem('rappel_user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            signup,
            login,
            logout,
            verifyEmail,
            refreshUser,
            isAuthenticated: !!user,
            isAdmin: user?.role === 'admin',
            isEmailVerified: user?.is_verified || user?.role === 'admin' || false,
            hasSubscription: user?.subscription_status === 'active' || user?.role === 'admin'
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
