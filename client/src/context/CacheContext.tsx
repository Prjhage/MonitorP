'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuth } from './AuthContext';
import { useSocket } from '@/hooks/useSocket';

interface ApiMonitor {
    _id: string;
    name: string;
    url: string;
    status: 'UP' | 'DOWN' | 'DEGRADED' | 'PENDING';
    lastChecked: string;
    isActive: boolean;
    responseTime?: number;
    interval: number;
}

interface HeartbeatMonitor {
    _id: string;
    name: string;
    slug: string;
    status: 'UP' | 'DOWN' | 'PENDING';
    lastPingAt: string;
    nextExpectedAt: string;
    isActive: boolean;
    expectedEvery: number;
    expectedEveryUnit: 'minutes' | 'hours' | 'days';
    gracePeriod: number;
    alertEmail: string;
}

interface CacheContextType {
    apis: ApiMonitor[];
    heartbeats: HeartbeatMonitor[];
    loading: boolean;
    fetchApis: (force?: boolean) => Promise<void>;
    fetchHeartbeats: (force?: boolean) => Promise<void>;
    addApi: (newApi: any) => Promise<void>;
    addHeartbeat: (newHb: any) => Promise<any>;
    updateApi: (id: string, data: Partial<ApiMonitor>) => void;
    updateHeartbeat: (id: string, data: Partial<HeartbeatMonitor>) => void;
    deleteApi: (id: string) => Promise<void>;
    deleteHeartbeat: (id: string) => Promise<void>;
    toggleApi: (id: string) => Promise<void>;
}

const CacheContext = createContext<CacheContextType>({} as CacheContextType);

export const CacheProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const socket = useSocket();
    const [apis, setApis] = useState<ApiMonitor[]>([]);
    const [heartbeats, setHeartbeats] = useState<HeartbeatMonitor[]>([]);
    const [loadingApis, setLoadingApis] = useState(true);
    const [loadingHb, setLoadingHb] = useState(true);
    const [lastFetchedApis, setLastFetchedApis] = useState<number>(0);
    const [lastFetchedHb, setLastFetchedHb] = useState<number>(0);

    const loading = loadingApis || loadingHb;

    const fetchApis = async (force = false) => {
        if (!force && apis.length > 0 && Date.now() - lastFetchedApis < 60000) {
            setLoadingApis(false);
            return;
        }
        if (!user) return;
        setLoadingApis(true);
        try {
            const { data } = await api.get('/apis');
            setApis(data);
            setLastFetchedApis(Date.now());
        } catch (error) {
            console.error('Failed to fetch APIs', error);
        } finally {
            setLoadingApis(false);
        }
    };

    const fetchHeartbeats = async (force = false) => {
        if (!force && heartbeats.length > 0 && Date.now() - lastFetchedHb < 60000) {
            setLoadingHb(false);
            return;
        }
        if (!user) return;
        setLoadingHb(true);
        try {
            const { data } = await api.get('/heartbeats');
            setHeartbeats(data);
            setLastFetchedHb(Date.now());
        } catch (error) {
            console.error('Failed to fetch Heartbeats', error);
        } finally {
            setLoadingHb(false);
        }
    };

    const addApi = async (newApi: any) => {
        const { data } = await api.post('/apis', newApi);
        setApis(prev => [...prev, data]);
    };

    const addHeartbeat = async (newHb: any) => {
        const { data } = await api.post('/heartbeats', newHb);
        setHeartbeats(prev => [...prev, data]);
        return data;
    };

    const updateApi = (id: string, data: Partial<ApiMonitor>) => {
        setApis(prev => prev.map(item => item._id === id ? { ...item, ...data } : item));
    };

    const updateHeartbeat = (id: string, data: Partial<HeartbeatMonitor>) => {
        setHeartbeats(prev => prev.map(item => item._id === id ? { ...item, ...data } : item));
    };

    const deleteApi = async (id: string) => {
        await api.delete(`/apis/${id}`);
        setApis(prev => prev.filter(api => api._id !== id));
    };

    const deleteHeartbeat = async (id: string) => {
        await api.delete(`/heartbeats/${id}`);
        setHeartbeats(prev => prev.filter(hb => hb._id !== id));
    };

    const toggleApi = async (id: string) => {
        const { data } = await api.patch(`/apis/${id}/toggle`);
        updateApi(id, data);
        return data; // Return updated data to caller
    };

    useEffect(() => {
        if (user?.token) {
            fetchApis();
            fetchHeartbeats();
        } else if (!user && !loading) {
            setApis([]);
            setHeartbeats([]);
        }
    }, [user?.token]);

    // Socket listeners for real-time cache updates
    useEffect(() => {
        if (socket && user) {
            socket.on('api-update', (data: any) => {
                updateApi(data.apiId, data);
            });
            socket.on('heartbeat-update', (data: any) => {
                updateHeartbeat(data.heartbeatId, data);
            });
            return () => {
                socket.off('api-update');
                socket.off('heartbeat-update');
            };
        }
    }, [socket, user]);

    return (
        <CacheContext.Provider value={{
            apis, heartbeats, loading, fetchApis, fetchHeartbeats,
            addApi, addHeartbeat, updateApi, updateHeartbeat, deleteApi, deleteHeartbeat, toggleApi
        }}>
            {children}
        </CacheContext.Provider>
    );
};

export const useCache = () => useContext(CacheContext);
