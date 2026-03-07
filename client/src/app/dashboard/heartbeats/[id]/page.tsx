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
    CheckCircle2, XCircle, Globe2, Pencil, X, Plus, Save, Copy,
    Play, Pause
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import { format, formatDistanceToNow } from 'date-fns';

const LABEL = 'block text-[10px] font-black uppercase tracking-[0.12em] text-gray-400 mb-1.5 ml-0.5';

export default function HeartbeatDetailPage() {
    const params = useParams();
    const { user } = useAuth();
    const router = useRouter();
    const { deleteHeartbeat, toggleHeartbeat } = useCache();
    const [data, setData] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [incidents, setIncidents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const { showToast } = useToast();
    const { confirm: askConfirm } = useConfirm();

    const handleCopy = async (text: string, id: string = 'main') => {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for older browsers or non-secure contexts
                const textArea = document.createElement("textarea");
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
            }
            setCopiedId(id);
            showToast('Copied to clipboard!', 'success');
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
            showToast('Failed to copy to clipboard', 'error');
        }
    };

    // Derive the backend base URL. Default to localhost if on localhost, otherwise use env var.
    const backendBase = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:5000'
        : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

    const fetchStats = async () => {
        try {
            const { data: resData } = await api.get(`/heartbeats/${params.id}/stats`);
            setData(resData.heartbeat);
            setLogs(resData.logs);
            setIncidents(resData.incidents);
        } catch (error) {
            console.error('Failed to fetch heartbeat stats', error);
            showToast('Failed to load heartbeat details', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params.id) fetchStats();
    }, [params.id]);

    const handleToggleActive = async () => {
        try {
            const updated = await toggleHeartbeat(params.id as string);
            setData(updated);
            showToast(updated.isPaused ? 'Monitoring Paused' : 'Monitoring Resumed', 'success');
        } catch (error) {
            console.error('Failed to toggle', error);
            showToast('Failed to update status', 'error');
        }
    };

    const handleDelete = async () => {
        askConfirm({
            title: 'Delete Heartbeat',
            message: 'Are you sure you want to remove this heartbeat monitor? You will no longer receive alerts for this service.',
            confirmText: 'Delete Monitor',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await deleteHeartbeat(params.id as string);
                    showToast('Heartbeat monitor deleted', 'success');
                    router.push('/dashboard/heartbeats');
                } catch (error) {
                    console.error('Failed to delete', error);
                    showToast('Failed to delete heartbeat. Please try again.', 'error');
                }
            }
        });
    };

    const formatDuration = (ms: number) => {
        if (!ms) return '---';
        if (ms < 1000) return `${ms}ms`;
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
        return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    };

    const signals = [
        { label: 'Job Started', suffix: '/start', color: 'blue', desc: 'Call at the very beginning of your task to mark it as RUNNING.' },
        { label: 'Job Succeeded', suffix: '', color: 'emerald', desc: 'Call when your task finishes successfully to calculate duration and reset status.' },
        { label: 'Job Failed', suffix: '/fail', color: 'rose', desc: 'Call in your catch/error block to immediately trigger a DOWN alert.' },
    ];

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
            </div>
        );
    }

    const pingUrlBase = `${backendBase}/ping/${data.slug}`;

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
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border animate-pulse
                                ${data.isPaused ? 'bg-gray-500/10 border-gray-500/20 text-gray-400' :
                                    data.status === 'UP' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                        data.status === 'DOWN' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                            data.status === 'RUNNING' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                                'bg-gray-500/10 border-gray-500/20 text-gray-400'}`}>
                                {data.isPaused ? 'PAUSED' : data.status}
                            </span>
                        </div>
                        <p className="text-gray-500 font-medium flex items-center gap-2">
                            <Zap className="w-4 h-4 text-pink-500" />
                            {data.scheduleType === 'cron' ? `Cron: ${data.cronExpression} (${data.timezone})` : `Expected every ${data.expectedEvery} ${data.expectedEveryUnit}`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        id="tour-pause-toggle"
                        onClick={handleToggleActive}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border ${data.isPaused
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                            }`}
                    >
                        {data.isPaused ? (
                            <><Play className="w-4 h-4 fill-current" /> Resume</>
                        ) : (
                            <><Pause className="w-4 h-4" /> Pause</>
                        )}
                    </button>
                    <button onClick={handleDelete} className="p-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl transition-all">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Performance Metrics */}
                    <div id="tour-hb-stats" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div id="tour-hb-avg-duration" className="glass-card p-6 rounded-3xl border border-white/5 flex flex-col justify-center bg-gradient-to-br from-blue-500/5 to-transparent">
                            <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" /> Avg Duration
                            </div>
                            <div className="text-2xl font-black text-white">{formatDuration(data.avgJobDuration || 0)}</div>
                        </div>
                        <div className="glass-card p-6 rounded-3xl border border-white/5 flex flex-col justify-center bg-gradient-to-br from-purple-500/5 to-transparent">
                            <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5" /> Last Run
                            </div>
                            <div className="text-2xl font-black text-white">{formatDuration(data.lastJobDuration || 0)}</div>
                        </div>
                        <div id="tour-hb-max-limit" className="glass-card p-6 rounded-3xl border border-white/5 flex flex-col justify-center bg-gradient-to-br from-amber-500/5 to-transparent">
                            <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <AlertCircle className="w-3.5 h-3.5" /> Max Limit
                            </div>
                            <div className="text-2xl font-black text-white">{data.maxDuration ? `${data.maxDuration} ${data.maxDurationUnit}` : '---'}</div>
                        </div>
                    </div>

                    {/* Integration Guide */}
                    <div id="tour-integration" className="glass-card p-8 rounded-[32px] border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 blur-[80px] rounded-full" />
                        <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                            <Database className="w-6 h-6 text-pink-500" /> Advanced Signal API
                        </h3>

                        <div className="space-y-6">
                            {signals.map((sig, i) => (
                                <div key={i} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-${sig.color}-500/10 text-${sig.color}-400 border border-${sig.color}-500/20`}>
                                                {sig.label}
                                            </span>
                                            <span className="text-xs text-gray-500 italic">{sig.desc}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(`curl.exe "${pingUrlBase}${sig.suffix}"`, `sig-${i}`)}
                                        className="w-full flex items-center gap-4 p-4 bg-black/50 border border-white/5 rounded-2xl group transition-all hover:border-white/20 hover:bg-white/[0.02]"
                                        title="Click to copy cURL command"
                                    >
                                        <code className="text-xs text-pink-400 font-mono flex-1 text-left break-all truncate">
                                            curl.exe "{pingUrlBase}{sig.suffix}"
                                        </code>
                                        <div
                                            className={`shrink-0 p-2 rounded-xl transition-all border ${copiedId === `sig-${i}`
                                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                : 'bg-white/5 group-hover:bg-white/10 text-gray-400 group-hover:text-white border-white/5'}`}
                                        >
                                            {copiedId === `sig-${i}` ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </div>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Ping Logs */}
                    <div className="glass-card p-8 rounded-[32px] border border-white/10">
                        <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                            <Clock className="w-6 h-6 text-blue-500" /> Performance Analytics
                        </h3>

                        {/* Simple Trend Visualizer */}
                        <div id="tour-latency-chart" className="h-48 flex items-end gap-1 mb-8 pt-4 px-2 border-b border-white/5">
                            {logs.filter(l => l.signalType === 'success' && l.jobDuration).slice(0, 30).reverse().map((log, i) => {
                                const height = Math.min(100, (log.jobDuration / (data.maxDuration * 60000 || data.avgJobDuration * 2 || 10000)) * 100);
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${height}%` }}
                                        className={`flex-1 rounded-t-sm group relative ${log.jobDuration > (data.maxDuration * 60000 || Infinity) ? 'bg-red-500' : 'bg-blue-500/40 hover:bg-blue-500'}`}
                                    >
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                                            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-2 rounded-lg text-[10px] text-white whitespace-nowrap shadow-2xl">
                                                {formatDuration(log.jobDuration)}<br />
                                                <span className="text-gray-400">{format(new Date(log.receivedAt), 'MMM dd, HH:mm')}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                            {logs.filter(l => l.signalType === 'success' && l.jobDuration).length === 0 && (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                                    <div className="text-xs font-black uppercase tracking-[0.2em]">Collecting Performance Data...</div>
                                    <div className="text-[10px] mt-2 italic opacity-60">Success signals with duration are required for trends.</div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            {logs.length === 0 ? (
                                <p className="text-gray-500 text-sm p-10 text-center">No signals received yet.</p>
                            ) : (
                                logs.map((log, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:bg-white/[0.04] transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${log.signalType === 'start' ? 'bg-blue-500 shadow-blue-500/20' :
                                                log.signalType === 'fail' ? 'bg-red-500 shadow-red-500/20' :
                                                    'bg-emerald-500 shadow-emerald-500/20'
                                                }`} />
                                            <div>
                                                <p className="text-sm font-bold text-white flex items-center gap-2">
                                                    {log.signalType === 'start' ? 'Job Started' :
                                                        log.signalType === 'fail' ? 'Job Failed' : 'Success Signal'}
                                                    {log.jobDuration && (
                                                        <span className="text-[10px] font-black bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-emerald-400">
                                                            {formatDuration(log.jobDuration)}
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-[10px] text-gray-500 uppercase font-black">{log.ipAddress} • {log.userAgent?.substring(0, 30)}...</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-300">{format(new Date(log.receivedAt), 'HH:mm:ss')}</p>
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
                    <div id="tour-hb-status" className="glass-card p-8 rounded-[32px] border border-white/10">
                        <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Job Status</h3>
                        <div className="space-y-6">
                            <div>
                                <p className={LABEL}>Current Status</p>
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                                    <div className={`w-3 h-3 rounded-full ${data.status === 'UP' ? 'bg-emerald-500 shadow-emerald-500/40' :
                                        data.status === 'DOWN' ? 'bg-red-500 shadow-red-500/40' :
                                            'bg-amber-500 shadow-amber-500/40'} shadow-lg animate-pulse`} />
                                    <span className="text-lg font-black text-white">{
                                        data.status === 'UP' ? 'Healthy' :
                                            data.status === 'DOWN' ? 'Offline' :
                                                data.status === 'RUNNING' ? 'In Progress' : 'Pending'
                                    }</span>
                                </div>
                            </div>

                            {data.status === 'RUNNING' && data.currentJobStartedAt && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl overflow-hidden">
                                    <p className={LABEL}>Running for</p>
                                    <p className="text-xl font-black text-amber-400">{formatDistanceToNow(new Date(data.currentJobStartedAt))}</p>
                                    <div className="mt-3 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-amber-500"
                                            animate={{ width: ['0%', '100%'] }}
                                            transition={{ duration: data.avgJobDuration / 1000 || 60, repeat: Infinity }}
                                        />
                                    </div>
                                </motion.div>
                            )}

                            <div>
                                <p className={LABEL}>Last Check-in</p>
                                <p className="text-lg font-black text-white flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-blue-400" />
                                    {data.lastPingAt ? formatDistanceToNow(new Date(data.lastPingAt), { addSuffix: true }) : 'Never'}
                                </p>
                            </div>
                            <div>
                                <p className={LABEL}>Next Deadline</p>
                                <p className="text-lg font-black text-white flex items-center gap-2 text-purple-400">
                                    <Globe className="w-5 h-5" />
                                    {data.nextExpectedAt ? formatDistanceToNow(new Date(data.nextExpectedAt), { addSuffix: true }) : '---'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Incidents */}
                    <div id="tour-hb-incidents-sidebar" className="glass-card p-8 rounded-[32px] border border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">Recent Incidents</h3>
                            {incidents.length > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{incidents.length}</span>}
                        </div>
                        <div className="space-y-4">
                            {incidents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-6 opacity-30">
                                    <Shield className="w-8 h-8 text-emerald-500 mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No Incidents</p>
                                </div>
                            ) : (
                                incidents.map((inc, i) => (
                                    <div key={i} className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl hover:bg-red-500/10 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-2 py-1 rounded-md">Alert Triggered</span>
                                            <span className="text-[10px] font-bold text-gray-500">{format(new Date(inc.detectedAt), 'MMM dd')}</span>
                                        </div>
                                        <p className="text-xs text-gray-300 font-medium leading-relaxed">{inc.message || 'Heartbeat missed expected window.'}</p>
                                        <div className="mt-3 text-[10px] text-gray-500 font-bold uppercase flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-sm" />
                                            {format(new Date(inc.detectedAt), 'HH:mm')}
                                        </div>
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
