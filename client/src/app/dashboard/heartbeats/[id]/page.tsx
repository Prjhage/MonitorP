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
        if (window.confirm('Are you sure you want to remove this heartbeat monitor?')) {
            try {
                console.log('Deleting heartbeat:', params.id);
                await deleteHeartbeat(params.id as string);
                router.push('/dashboard/heartbeats');
                router.refresh(); // Ensure list is updated
            } catch (error) {
                console.error('Failed to delete', error);
                alert('Failed to delete heartbeat. Please try again.');
            }
        }
    };

    if (loading) return <div className="p-10 text-white">Loading...</div>;
    if (!data) return <div className="p-10 text-white">Heartbeat not found.</div>;

    const pingUrl = `${window.location.origin.replace('3000', '5000')}/ping/${data.slug}`;

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

                        <div className="space-y-6">
                            <div>
                                <label className={LABEL}>Unique Ping URL</label>
                                <div className="flex items-center gap-3 p-4 bg-black/40 border border-white/10 rounded-2xl relative group/url">
                                    <code className="text-sm text-pink-400 font-mono flex-1 break-all">{pingUrl}</code>
                                    <button
                                        onClick={() => handleCopy(pingUrl)}
                                        className={`p-2 rounded-lg transition-all flex items-center gap-2 ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
                                    >
                                        {copied ? (
                                            <>
                                                <span className="text-[10px] font-black uppercase tracking-widest">Copied!</span>
                                                <CheckCircle2 className="w-4 h-4" />
                                            </>
                                        ) : (
                                            <Copy className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">cURL / Bash</p>
                                    <code className="text-[11px] text-gray-400 leading-relaxed block bg-black/20 p-3 rounded-lg">
                                        curl {pingUrl}
                                    </code>
                                </div>
                                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col">
                                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">Node.js (Axios)</p>
                                    <div className="relative group/code flex-1">
                                        <div className="bg-black/40 rounded-xl p-4 border border-white/5 font-mono text-[11px] text-gray-400 leading-relaxed overflow-x-auto">
                                            <div className="text-gray-600 mb-2">// Install: npm install axios</div>
                                            <div className="flex gap-2">
                                                <span className="text-purple-400">const</span>
                                                <span className="text-blue-400">axios</span>
                                                <span className="text-gray-500">=</span>
                                                <span className="text-yellow-400">require</span>
                                                <span className="text-gray-500">(</span>
                                                <span className="text-emerald-400">'axios'</span>
                                                <span className="text-gray-500">);</span>
                                            </div>
                                            <div className="mt-2 flex gap-2">
                                                <span className="text-purple-400">await</span>
                                                <span className="text-blue-400">axios</span>
                                                <span className="text-gray-500">.</span>
                                                <span className="text-yellow-400">get</span>
                                                <span className="text-gray-500">(</span>
                                                <span className="text-emerald-400">'{pingUrl}'</span>
                                                <span className="text-gray-500">);</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleCopy(`await axios.get('${pingUrl}');`)}
                                            className="absolute top-3 right-3 p-2 bg-white/5 hover:bg-white/10 rounded-lg opacity-0 group-hover/code:opacity-100 transition-all text-gray-400 hover:text-white"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
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

// Sub-component Code
function Code({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
    )
}
