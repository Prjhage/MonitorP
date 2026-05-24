'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

interface ApiMonitor {
    _id: string;
    name: string;
    url: string;
    status: 'UP' | 'DOWN' | 'DEGRADED' | 'PENDING';
    lastChecked: string;
    isActive: boolean;
    responseTime?: number;
    interval: number;
    inMaintenance?: boolean;
}

interface HeartbeatMonitor {
    _id: string;
    name: string;
    slug: string;
    status: 'UP' | 'DOWN' | 'PENDING' | 'RUNNING';
    lastPingAt: string;
    nextExpectedAt: string;
    isActive: boolean;
    isPaused: boolean;
    expectedEvery: number;
    expectedEveryUnit: 'minutes' | 'hours' | 'days';
    gracePeriod: number;
    scheduleType?: 'interval' | 'cron';
    cronExpression?: string;
    timezone?: string;
    maxDuration?: number;
    maxDurationUnit?: 'seconds' | 'minutes' | 'hours';
    avgJobDuration?: number;
    lastJobDuration?: number;
    currentJobStartedAt?: string;
    alertEmail: string;
    inMaintenance?: boolean;
}

interface GenericMonitor {
    _id: string;
    name: string;
    status: string;
    isActive: boolean;
    inMaintenance?: boolean;
}

interface CacheContextType {
    apis: ApiMonitor[];
    heartbeats: HeartbeatMonitor[];
    ssls: GenericMonitor[];
    tcps: GenericMonitor[];
    dns: GenericMonitor[];
    domains: GenericMonitor[];
    loading: boolean;
    fetchApis: (force?: boolean) => Promise<void>;
    fetchHeartbeats: (force?: boolean) => Promise<void>;
    fetchSsls: (force?: boolean) => Promise<void>;
    fetchTcps: (force?: boolean) => Promise<void>;
    fetchDns: (force?: boolean) => Promise<void>;
    fetchDomains: (force?: boolean) => Promise<void>;
    addApi: (newApi: any) => Promise<void>;
    addHeartbeat: (newHb: any) => Promise<any>;
    updateApi: (id: string, data: Partial<ApiMonitor>) => void;
    updateHeartbeat: (id: string, data: Partial<HeartbeatMonitor>) => void;
    updateSsl: (id: string, data: any) => void;
    updateTcp: (id: string, data: any) => void;
    updateDns: (id: string, data: any) => void;
    updateDomain: (id: string, data: any) => void;
    deleteApi: (id: string) => Promise<void>;
    deleteHeartbeat: (id: string) => Promise<void>;
    toggleApi: (id: string) => Promise<void>;
    toggleHeartbeat: (id: string) => Promise<any>;
    refreshAll: () => Promise<void>;
}

const CacheContext = createContext<CacheContextType>({} as CacheContextType);

export const CacheProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const socket = useSocket();
    const [apis, setApis] = useState<ApiMonitor[]>([]);
    const [heartbeats, setHeartbeats] = useState<HeartbeatMonitor[]>([]);
    const [ssls, setSsls] = useState<GenericMonitor[]>([]);
    const [tcps, setTcps] = useState<GenericMonitor[]>([]);
    const [dns, setDns] = useState<GenericMonitor[]>([]);
    const [domains, setDomains] = useState<GenericMonitor[]>([]);
    const [loadingApis, setLoadingApis] = useState(true);
    const [loadingHb, setLoadingHb] = useState(true);
    const [loadingSsl, setLoadingSsl] = useState(true);
    const [loadingTcp, setLoadingTcp] = useState(true);
    const [loadingDns, setLoadingDns] = useState(true);
    const [loadingDomains, setLoadingDomains] = useState(true);
    const [lastFetchedApis, setLastFetchedApis] = useState<number>(0);
    const [lastFetchedHb, setLastFetchedHb] = useState<number>(0);
    const [lastFetchedSsl, setLastFetchedSsl] = useState<number>(0);
    const [lastFetchedTcp, setLastFetchedTcp] = useState<number>(0);
    const [lastFetchedDns, setLastFetchedDns] = useState<number>(0);
    const [lastFetchedDomains, setLastFetchedDomains] = useState<number>(0);

    const loading = loadingApis || loadingHb || loadingSsl || loadingTcp || loadingDns || loadingDomains;

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

    const fetchSsls = async (force = false) => {
        if (!force && ssls.length > 0 && Date.now() - lastFetchedSsl < 60000) {
            setLoadingSsl(false);
            return;
        }
        if (!user) return;
        setLoadingSsl(true);
        try {
            const { data } = await api.get('/ssl');
            setSsls(data);
            setLastFetchedSsl(Date.now());
        } catch (error) {
            console.error('Failed to fetch SSLs', error);
        } finally {
            setLoadingSsl(false);
        }
    };

    const fetchTcps = async (force = false) => {
        if (!force && tcps.length > 0 && Date.now() - lastFetchedTcp < 60000) {
            setLoadingTcp(false);
            return;
        }
        if (!user) return;
        setLoadingTcp(true);
        try {
            const { data } = await api.get('/tcp');
            setTcps(data);
            setLastFetchedTcp(Date.now());
        } catch (error) {
            console.error('Failed to fetch TCPs', error);
        } finally {
            setLoadingTcp(false);
        }
    };

    const fetchDns = async (force = false) => {
        if (!force && dns.length > 0 && Date.now() - lastFetchedDns < 60000) {
            setLoadingDns(false);
            return;
        }
        if (!user) return;
        setLoadingDns(true);
        try {
            const { data } = await api.get('/dns');
            setDns(data);
            setLastFetchedDns(Date.now());
        } catch (error) {
            console.error('Failed to fetch DNS', error);
        } finally {
            setLoadingDns(false);
        }
    };

    const fetchDomains = async (force = false) => {
        if (!force && domains.length > 0 && Date.now() - lastFetchedDomains < 60000) {
            setLoadingDomains(false);
            return;
        }
        if (!user) return;
        setLoadingDomains(true);
        try {
            const { data } = await api.get('/domains');
            setDomains(data);
            setLastFetchedDomains(Date.now());
        } catch (error) {
            console.error('Failed to fetch Domains', error);
        } finally {
            setLoadingDomains(false);
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

    const updateSsl = (id: string, data: any) => {
        setSsls(prev => prev.map(item => item._id === id ? { ...item, ...data } : item));
    };

    const updateTcp = (id: string, data: any) => {
        setTcps(prev => prev.map(item => item._id === id ? { ...item, ...data } : item));
    };

    const updateDns = (id: string, data: any) => {
        setDns(prev => prev.map(item => item._id === id ? { ...item, ...data } : item));
    };

    const updateDomain = (id: string, data: any) => {
        setDomains(prev => prev.map(item => item._id === id ? { ...item, ...data } : item));
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

    const toggleHeartbeat = async (id: string) => {
        console.log('!!!!!!!! [PAUSE TRIGGERED] ID:', id);
        const { data } = await api.patch(`/heartbeats/${id}/toggle`);
        updateHeartbeat(id, data);
        return data;
    };

    const refreshAll = async () => {
        await Promise.all([
            fetchApis(true),
            fetchHeartbeats(true),
            fetchSsls(true),
            fetchTcps(true),
            fetchDns(true),
            fetchDomains(true)
        ]);
    };

    useEffect(() => {
        if (user?.token) {
            fetchApis();
            fetchHeartbeats();
            fetchSsls();
            fetchTcps();
            fetchDns();
            fetchDomains();
        } else if (!user && !loading) {
            setApis([]);
            setHeartbeats([]);
            setSsls([]);
            setTcps([]);
            setDns([]);
            setDomains([]);
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
            socket.on('ssl-update', (data: any) => {
                updateSsl(data.sslId, data);
            });
            socket.on('tcp-update', (data: any) => {
                updateTcp(data.tcpId, data);
            });
            socket.on('dns-update', (data: any) => {
                updateDns(data.dnsId, data);
            });
            socket.on('domain-update', (data: any) => {
                updateDomain(data.domainId, data);
            });
            return () => {
                socket.off('api-update');
                socket.off('heartbeat-update');
                socket.off('ssl-update');
                socket.off('tcp-update');
                socket.off('dns-update');
                socket.off('domain-update');
            };
        }
    }, [socket, user]);

    return (
        <CacheContext.Provider value={{
            apis, heartbeats, ssls, tcps, dns, domains, loading, 
            fetchApis, fetchHeartbeats, fetchSsls, fetchTcps, fetchDns, fetchDomains,
            addApi, addHeartbeat, 
            updateApi, updateHeartbeat, updateSsl, updateTcp, updateDns, updateDomain,
            deleteApi, deleteHeartbeat, toggleApi, toggleHeartbeat,
            refreshAll
        }}>
            {children}
        </CacheContext.Provider>
    );
};

export const useCache = () => useContext(CacheContext);
