'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    [key: string]: any;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser && storedUser !== 'undefined') {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
            }
        }

        // Optional: Validate token with backend
        setLoading(false);
    };

    const login = (token: string, userData: User) => {
        if (!userData) {
            console.error('Login attempted without user data');
            return;
        }
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        router.push('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/auth/login');
    };

    const refreshUser = async () => {
        try {
            const res = await api.get('/auth/me');
            const freshUser = res.data?.user || res.data;
            if (freshUser) {
                localStorage.setItem('user', JSON.stringify(freshUser));
                setUser(freshUser);
            }
        } catch (error) {
            console.error('Failed to refresh user', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
