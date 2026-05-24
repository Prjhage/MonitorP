'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

interface User {
    _id: string;
    fullName: string;
    companyName: string;
    email: string;
    token: string;
    orgId?: string;
    role?: UserRole;
}

interface AuthContextType {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    loading: boolean;
    role: UserRole;
    isAtLeast: (minRole: UserRole) => boolean;
    login: (credentials: any) => Promise<void>;
    register: (userData: any) => Promise<void>;
    logout: () => void;
}

const ROLE_LEVELS: Record<UserRole, number> = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1,
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const initAuth = async () => {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);

                    // Fetch fresh profile to get updated orgId/role (legacy migration)
                    const { data } = await api.get('/auth/me');
                    const updatedUser = { ...parsedUser, ...data };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                } catch (err) {
                    console.error('Session refresh failed', err);
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const role: UserRole = (user?.role as UserRole) || 'viewer';

    /**
     * Returns true if the current user's role is at least minRole.
     * e.g. isAtLeast('admin') → true for owner and admin, false for member/viewer
     */
    const isAtLeast = (minRole: UserRole): boolean => {
        const userLevel = ROLE_LEVELS[role] || 0;
        const minLevel  = ROLE_LEVELS[minRole] || 0;
        return userLevel >= minLevel;
    };

    const login = async (credentials: any) => {
        const { data } = await api.post('/auth/login', credentials);
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        router.push('/dashboard');
    };

    const register = async (userData: any) => {
        const { data } = await api.post('/auth/register', userData);
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        router.push('/dashboard');
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, role, isAtLeast, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
