'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useCache } from '@/context/CacheContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Heart, Clock, Globe, Shield,
    AlertCircle, Database, Trash2, Zap,
    CheckCircle2, XCircle, Globe2, Pencil, X, Plus, Save, Copy
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import { format, formatDistanceToNow } from 'date-fns';

const LABEL = 'block text-[10px] font-black uppercase tracking-[0.12em] text-gray-400 mb-1.5 ml-0.5';

export default function HeartbeatDetailPage() {
    const params = useParams();
    const { user } = useAuth();
    const router = useRouter();
    const { deleteHeartbeat } = useCache();
    const [data, setData] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [incidents, setIncidents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    // Derive the backend base URL from the env var (strip trailing /api)
    const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const fetchStats = async () => {
        try {
            const { data } = await api.get(`/heartbeats/${params.id}/stats`);
            setData(data.heartbeat);
            setLogs(data.logs);
            setIncidents(data.incidents);
        } catch (error) {
            console.error('Failed to fetch heartbeat stats', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params.id) fetchStats();
    }, [params.id]);

    const handleDelete = async () => {
        confirm({
            title: 'Delete Heartbeat',
            message: 'Are you sure you want to remove this heartbeat monitor? You will no longer receive alerts for this service.',
            confirmText: 'Delete Monitor',
            type: 'danger',
            onConfirm: async () => {
                try {
                    console.log('Deleting heartbeat:', params.id);
                    await deleteHeartbeat(params.id as string);
                    showToast('Heartbeat monitor deleted', 'success');
                    router.push('/dashboard/heartbeats');
                    router.refresh();
                } catch (error) {
                    console.error('Failed to delete', error);
                    showToast('Failed to delete heartbeat. Please try again.', 'error');
                }
            }
        });
    };

    if (loading) return <div className="p-10 text-white">Loading...</div>;
    if (!data) return <div className="p-10 text-white">Heartbeat not found.</div>;

    const pingUrl = `${backendBase}/ping/${data.slug}`;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-6">
                    <button onClick={() => router.back()} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-3xl font-black text-white tracking-tight">{data.name}</h2>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border
                                ${data.status === 'UP' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                    data.status === 'DOWN' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                        'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                                {data.status}
                            </span>
                        </div>
                        <p className="text-gray-500 font-medium flex items-center gap-2">
                            <Zap className="w-4 h-4 text-pink-500" />
                            Expected every {data.expectedEvery} {data.expectedEveryUnit}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={handleDelete} className="p-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl transition-all">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Integration Guide */}
                    <div className="glass-card p-8 rounded-[32px] border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 blur-[80px] rounded-full" />
                        <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                            <Database className="w-6 h-6 text-pink-500" /> Integration Setup
                        </h3>

                        <div className="space-y-4">
                            {/* Ping URL */}
                            <div>
                                <label className={LABEL}>Unique Ping URL</label>
                                <div className="flex items-center gap-3 p-4 bg-black/50 border border-pink-500/25 rounded-2xl">
                                    <code className="text-sm text-pink-400 font-mono flex-1 break-all leading-relaxed">{pingUrl}</code>
                                    <button
                                        onClick={() => handleCopy(pingUrl)}
                                        className={`shrink-0 px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 text-xs font-bold border ${copied
                                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/10'
                                            }`}
                                    >
                                        {copied ? (
                                            <><CheckCircle2 className="w-3.5 h-3.5" /><span>Copied!</span></>
                                        ) : (
                                            <><Copy className="w-3.5 h-3.5" /><span>Copy URL</span></>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* cURL */}
                            <div className="rounded-2xl overflow-hidden border border-white/[0.07]">
                                <div className="flex items-center justify-between px-4 py-2.5 bg-[#0d1520] border-b border-white/[0.07]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.15em]">cURL / Bash</span>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(`curl ${pingUrl}`)}
                                        className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all flex items-center gap-1.5"
                                    >
                                        <Copy className="w-3 h-3" /> Copy
                                    </button>
                                </div>
                                <div className="bg-[#060910] p-4 font-mono text-[12px] leading-7 break-all">
                                    <span className="text-yellow-400">curl </span>
                                    <span className="text-pink-400">{pingUrl}</span>
                                </div>
                            </div>

                            {/* Node.js */}
                            <div className="rounded-2xl overflow-hidden border border-white/[0.07]">
                                <div className="flex items-center justify-between px-4 py-2.5 bg-[#071a10] border-b border-white/[0.07]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.15em]">Node.js (Axios)</span>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(`const axios = require('axios');\nawait axios.get('${pingUrl}');`)}
                                        className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all flex items-center gap-1.5"
                                    >
                                        <Copy className="w-3 h-3" /> Copy
                                    </button>
                                </div>
                                <div className="bg-[#060910] p-4 font-mono text-[12px] leading-7 space-y-0.5">
                                    <div className="text-gray-600">{'// npm install axios'}</div>
                                    <div>
                                        <span className="text-purple-400">const </span>
                                        <span className="text-blue-300">axios </span>
                                        <span className="text-gray-500">= </span>
                                        <span className="text-yellow-400">require</span>
                                        <span className="text-gray-400">(</span>
                                        <span className="text-emerald-300">&apos;axios&apos;</span>
                                        <span className="text-gray-400">);</span>
                                    </div>
                                    <div className="break-all">
                                        <span className="text-purple-400">await </span>
                                        <span className="text-blue-300">axios</span>
                                        <span className="text-gray-500">.</span>
                                        <span className="text-yellow-400">get</span>
                                        <span className="text-gray-400">(</span>
                                        <span className="text-emerald-300 break-all">&apos;{pingUrl}&apos;</span>
                                        <span className="text-gray-400">);</span>
                                    </div>
                                </div>
                            </div>

                            {/* Python */}
                            <div className="rounded-2xl overflow-hidden border border-white/[0.07]">
                                <div className="flex items-center justify-between px-4 py-2.5 bg-[#1a1400] border-b border-white/[0.07]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                                        <span className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.15em]">Python (requests)</span>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(`import requests\nrequests.get('${pingUrl}')`)}
                                        className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all flex items-center gap-1.5"
                                    >
                                        <Copy className="w-3 h-3" /> Copy
                                    </button>
                                </div>
                                <div className="bg-[#060910] p-4 font-mono text-[12px] leading-7 space-y-0.5">
                                    <div>
                                        <span className="text-purple-400">import </span>
                                        <span className="text-blue-300">requests</span>
                                    </div>
                                    <div className="break-all">
                                        <span className="text-blue-300">requests</span>
                                        <span className="text-gray-500">.</span>
                                        <span className="text-yellow-400">get</span>
                                        <span className="text-gray-400">(</span>
                                        <span className="text-emerald-300">&apos;{pingUrl}&apos;</span>
                                        <span className="text-gray-400">)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ping Logs */}
                    <div className="glass-card p-8 rounded-[32px] border border-white/10">
                        <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                            <Clock className="w-6 h-6 text-blue-500" /> Recent Pings
                        </h3>
                        <div className="space-y-3">
                            {logs.length === 0 ? (
                                <p className="text-gray-500 text-sm">No pings received yet.</p>
                            ) : (
                                logs.map((log, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                                            <div>
                                                <p className="text-sm font-bold text-white">Received Ping</p>
                                                <p className="text-[10px] text-gray-500 uppercase font-black">{log.ipAddress} • {log.userAgent?.substring(0, 30)}...</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-300">{format(new Date(log.receivedAt), 'MMM dd, HH:mm:ss')}</p>
                                            <p className="text-[10px] text-gray-500 font-bold">{formatDistanceToNow(new Date(log.receivedAt), { addSuffix: true })}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-8">
                    {/* Status Overview */}
                    <div className="glass-card p-8 rounded-[32px] border border-white/10">
                        <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-6">Overview</h3>
                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Status</p>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2.5 h-2.5 rounded-full ${data.status === 'UP' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                                    <span className="text-lg font-black text-white">{data.status === 'UP' ? 'Healthy' : 'Downtime Detected'}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Last Reported</p>
                                <p className="text-lg font-black text-white">
                                    {data.lastPingAt ? formatDistanceToNow(new Date(data.lastPingAt), { addSuffix: true }) : 'Never'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Next Expected</p>
                                <p className="text-lg font-black text-white">
                                    {data.nextExpectedAt ? formatDistanceToNow(new Date(data.nextExpectedAt), { addSuffix: true }) : '---'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Incidents */}
                    <div className="glass-card p-8 rounded-[32px] border border-white/10">
                        <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-6">Recent Incidents</h3>
                        <div className="space-y-4">
                            {incidents.length === 0 ? (
                                <p className="text-xs text-gray-600">No incidents recorded.</p>
                            ) : (
                                incidents.map((inc, i) => (
                                    <div key={i} className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Missed Ping</span>
                                            <span className="text-[10px] font-bold text-gray-500">{format(new Date(inc.detectedAt), 'MMM dd')}</span>
                                        </div>
                                        <p className="text-xs text-gray-300 font-medium">Silent for {inc.duration ? `${inc.duration}m` : 'monitoring...'}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
