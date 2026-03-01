'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useCache } from '@/context/CacheContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Activity, Clock, Globe, Shield,
    AlertCircle, Database, Trash2, Play, Pause,
    CheckCircle2, XCircle, Globe2, Pencil, X, Plus, Save
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import { format, formatDistanceToNow } from 'date-fns';

// ─── Styles (inline so Tailwind v4 can't drop them) ──────────────────────────
const INPUT = 'w-full px-4 py-3 rounded-[14px] text-white text-sm outline-none transition-all duration-200 placeholder-white/20';
const INPUT_STYLE = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' };
const LABEL = 'block text-[10px] font-black uppercase tracking-[0.12em] text-gray-400 mb-1.5 ml-0.5';
const SELECT_ARROW = {
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
    backgroundPosition: 'right 0.6rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em',
};

// ─── HTTP Method badge colours ────────────────────────────────────────────────
const METHOD_COLORS: Record<string, string> = {
    GET: '#10b981', POST: '#3b82f6', PUT: '#f59e0b', PATCH: '#8b5cf6', DELETE: '#ef4444', HEAD: '#6b7280',
};

// ─── Region helpers ───────────────────────────────────────────────────────────
const REGION_COLORS = {
    good: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    medium: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    bad: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    none: { text: 'text-gray-500', bg: 'bg-white/[0.02]', border: 'border-white/[0.05]' },
};
function getRegionColor(ms: number | null) {
    if (ms === null) return REGION_COLORS.none;
    if (ms < 200) return REGION_COLORS.good;
    if (ms < 400) return REGION_COLORS.medium;
    return REGION_COLORS.bad;
}

// ─── KV Pair editor ───────────────────────────────────────────────────────────
interface KVPair { key: string; value: string; }
function KVEditor({ label, pairs, onChange }: { label: string; pairs: KVPair[]; onChange: (p: KVPair[]) => void }) {
    const update = (i: number, field: 'key' | 'value', val: string) => {
        const u = [...pairs]; u[i] = { ...u[i], [field]: val }; onChange(u);
    };
    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <span className={LABEL}>{label}</span>
                <button type="button" onClick={() => onChange([...pairs, { key: '', value: '' }])}
                    className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 px-2.5 py-1 rounded-lg transition-all"
                    style={{ background: 'rgba(59,130,246,0.1)' }}>
                    <Plus className="w-3 h-3" /> Add
                </button>
            </div>
            {pairs.length === 0 && (
                <div className="py-4 text-center text-xs text-gray-600 rounded-xl" style={{ border: '1px dashed rgba(255,255,255,0.07)' }}>
                    No {label.toLowerCase()} added
                </div>
            )}
            <div className="space-y-2">
                {pairs.map((p, i) => (
                    <div key={i} className="flex gap-2">
                        <input value={p.key} onChange={(e) => update(i, 'key', e.target.value)}
                            placeholder="Key" className={INPUT + ' flex-1'} style={INPUT_STYLE} />
                        <input value={p.value} onChange={(e) => update(i, 'value', e.target.value)}
                            placeholder="Value" className={INPUT + ' flex-1'} style={INPUT_STYLE} />
                        <button type="button" onClick={() => onChange(pairs.filter((_, idx) => idx !== i))}
                            className="p-3 text-gray-600 hover:text-red-400 rounded-xl transition-all shrink-0"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DetailPage() {
    const params = useParams();
    const { user } = useAuth();
    const router = useRouter();
    const { toggleApi, deleteApi } = useCache();
    const [data, setData] = useState<any>(null);
    const [regionalStats, setRegionalStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    // Edit panel state
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [editTab, setEditTab] = useState<'basic' | 'advanced'>('basic');

    useEffect(() => {
        if (params.id && user?.token) {
            fetchDetails();
            fetchRegionalStats();
        }
    }, [params.id, user?.token]);

    const fetchDetails = async () => {
        try {
            const response = await api.get(`/apis/${params.id}/stats`);
            setData(response.data);
        } catch (error) {
            console.error('Failed to fetch stats', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRegionalStats = async () => {
        try {
            const response = await api.get(`/apis/${params.id}/regional-stats`);
            setRegionalStats(response.data);
        } catch (error) {
            console.error('Failed to fetch regional stats', error);
        }
    };

    const openEdit = () => {
        const m = data.api;
        setEditForm({
            name: m.name || '',
            url: m.url || '',
            method: m.method || 'GET',
            expectedStatus: m.expectedStatus || 200,
            interval: m.interval || 1,
            alertEmail: m.alertEmail || '',
            timeout: m.timeout || 10000,
            headers: m.headers || [],
            queryParams: m.queryParams || [],
            body: m.body || '',
        });
        setEditTab('basic');
        setIsEditing(true);
        setSaveSuccess(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data: updated } = await api.patch(`/apis/${params.id}`, editForm);
            setData((prev: any) => ({ ...prev, api: updated }));
            setSaveSuccess(true);
            showToast('Changes saved successfully', 'success');
            setTimeout(() => { setIsEditing(false); setSaveSuccess(false); }, 900);
        } catch (err) {
            console.error('Failed to save', err);
            showToast('Failed to save changes', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async () => {
        try {
            const updatedApi = await toggleApi(params.id as string);
            setData({ ...data, api: updatedApi });
        } catch (error) {
            console.error('Failed to toggle monitor', error);
        }
    };

    const handleDelete = async () => {
        confirm({
            title: 'Delete Monitor',
            message: 'Are you sure you want to remove this monitor? This will delete all historical logs and configuration permanentely.',
            confirmText: 'Delete Forever',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await deleteApi(params.id as string);
                    showToast('Monitor deleted successfully', 'success');
                    router.push('/dashboard');
                } catch {
                    showToast('Failed to delete monitor', 'error');
                }
            }
        });
    };

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (loading) return (
        <div className="max-w-6xl mx-auto p-10">
            <div className="h-6 w-32 bg-white/5 rounded-full mb-8 animate-pulse" />
            <div className="flex justify-between items-start mb-12">
                <div className="space-y-4">
                    <div className="h-12 w-64 bg-white/10 rounded-2xl animate-pulse" />
                    <div className="h-4 w-48 bg-white/5 rounded-full animate-pulse" />
                </div>
                <div className="flex gap-4">
                    <div className="w-28 h-10 bg-white/5 rounded-2xl animate-pulse" />
                    <div className="w-28 h-10 bg-white/5 rounded-2xl animate-pulse" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {[1, 2, 3].map(i => (
                    <div key={i} className="glass-card p-8 border border-white/[0.05] h-40 animate-pulse" />
                ))}
            </div>
        </div>
    );

    if (!data) return <div className="p-10 text-white">Monitor not found.</div>;

    const { api: monitor, uptime, logs, incidents, latestAssertionResults } = data;
    const avgResponseTime = logs.length > 0
        ? Math.round(logs.reduce((acc: number, log: any) => acc + (log.responseTime || 0), 0) / logs.length)
        : 0;
    const methodColor = METHOD_COLORS[monitor.method] || '#6b7280';

    const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };
    const itemVariants = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 26, stiffness: 110 } } };

    return (
        <motion.div initial="hidden" animate="show" variants={containerVariants}
            className="min-h-screen bg-transparent p-10 relative z-10">
            <div className="max-w-6xl mx-auto">

                {/* ─── Header ─────────────────────────────────────────────── */}
                <motion.header variants={itemVariants} className="mb-12">
                    <button onClick={() => router.push('/dashboard')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
                    </button>

                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-4 mb-3 flex-wrap">
                                <h1 className="text-5xl font-black text-white tracking-tighter">{monitor.name}</h1>

                                {/* HTTP Method badge */}
                                <span className="px-3 py-1.5 rounded-xl text-xs font-black tracking-widest"
                                    style={{ background: `${methodColor}18`, color: methodColor, border: `1px solid ${methodColor}35` }}>
                                    {monitor.method || 'GET'}
                                </span>

                                {/* Status badge */}
                                <div className={`px-4 py-1.5 rounded-full text-xs font-black tracking-widest ${!monitor.isActive ? 'bg-gray-500/10 text-gray-400' :
                                    monitor.status === 'UP' ? 'bg-emerald-500/10 text-emerald-500' :
                                        monitor.status === 'DEGRADED' ? 'bg-amber-500/10 text-amber-500' :
                                            'bg-red-500/10 text-red-500'
                                    }`}>
                                    {!monitor.isActive ? 'PAUSED' : monitor.status}
                                </div>
                            </div>
                            <p className="text-gray-500 font-medium flex items-center gap-2 px-1">
                                <Globe className="w-4 h-4 text-blue-500/50" />
                                <span className="font-mono text-sm">{monitor.url}</span>
                            </p>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap justify-end">
                            {/* ✏️ Edit button */}
                            <button onClick={openEdit}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-200 border text-blue-400 border-blue-500/20 hover:bg-blue-500/10">
                                <Pencil className="w-4 h-4" /> Edit Monitor
                            </button>

                            <button onClick={handleToggle}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-200 border ${monitor.isActive
                                    ? 'text-amber-500 border-amber-500/10 hover:bg-amber-500/10'
                                    : 'text-emerald-500 border-emerald-500/10 hover:bg-emerald-500/10'
                                    }`}>
                                {monitor.isActive ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Resume</>}
                            </button>
                            <button onClick={handleDelete}
                                className="flex items-center gap-2 text-red-500 hover:bg-red-500/10 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all border border-red-500/10">
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                        </div>
                    </div>
                </motion.header>

                {/* ─── Stats Grid ─────────────────────────────────────────── */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {[
                        { label: 'Current Uptime (24h)', value: `${uptime.toFixed(2)}%`, icon: Activity, color: 'text-blue-500' },
                        { label: 'Avg Response Time', value: `${avgResponseTime}ms`, icon: Clock, color: 'text-purple-500' },
                        { label: 'Incident Count', value: incidents.length, icon: Shield, color: 'text-red-500' }
                    ].map((stat, i) => (
                        <motion.div key={i} whileHover={{ y: -5, scale: 1.02 }}
                            className="glass-card p-8 border border-white/[0.05] hover:border-white/[0.1] transition-colors group">
                            <div className="text-gray-500 text-[11px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                <stat.icon className={`w-4 h-4 ${stat.color}`} /> {stat.label}
                            </div>
                            <div className="text-4xl font-black text-white group-hover:text-blue-400 transition-colors tracking-tight">
                                {stat.value}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* ─── Assertion Results ────────────────────────────────────── */}
                {monitor.assertions && monitor.assertions.length > 0 && (
                    <motion.div variants={itemVariants} className="mb-12">
                        <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 tracking-tight">
                            <CheckCircle2 className="w-6 h-6 text-violet-500" /> Assertion Results
                            <span className="text-sm font-medium text-gray-500 ml-auto">From last ping</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {monitor.assertions.map((assertion: any, idx: number) => {
                                const result = latestAssertionResults?.[idx];
                                const passed = result?.passed ?? null;
                                const actual = result?.actual ?? 'No data yet';
                                const label = `${assertion.type.replace(/_/g, ' ')} ${assertion.operator} ${assertion.value}`;
                                return (
                                    <motion.div key={idx} whileHover={{ y: -2 }}
                                        className={`p-5 rounded-2xl border flex items-start gap-4 transition-all ${passed === null ? 'border-white/[0.06] bg-white/[0.02]' :
                                            passed ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                                        <div className="mt-0.5 shrink-0">
                                            {passed === null ? (
                                                <div className="w-6 h-6 rounded-full border-2 border-gray-700 text-gray-700 flex items-center justify-center">
                                                    <span className="text-[10px] font-black">?</span>
                                                </div>
                                            ) : passed ? (
                                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                            ) : (
                                                <XCircle className="w-6 h-6 text-red-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white capitalize truncate">{label}</p>
                                            <p className="text-xs text-gray-500 mt-1 font-mono">
                                                Actual: <span className="text-gray-300">{actual}</span>
                                            </p>
                                        </div>
                                        <span className={`text-[10px] font-black tracking-widest px-2.5 py-1 rounded-lg shrink-0 ${passed === null ? 'bg-gray-500/10 text-gray-500' :
                                            passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {passed === null ? 'PENDING' : passed ? 'PASS' : 'FAIL'}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* ─── Geographic Performance ──────────────────────────────── */}
                <motion.div variants={itemVariants} className="mb-12">
                    <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 tracking-tight">
                        <Globe2 className="w-6 h-6 text-blue-500" /> Geographic Performance
                        <span className="text-sm font-medium text-gray-500 ml-auto">Last 48 hours · Simulated</span>
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {regionalStats.length === 0
                            ? Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="glass-card p-5 border border-white/[0.05] animate-pulse h-32" />
                            ))
                            : regionalStats.map((region) => {
                                const colors = getRegionColor(region.avgResponseTime);
                                return (
                                    <motion.div key={region.id} whileHover={{ y: -4, scale: 1.03 }}
                                        className={`relative p-5 rounded-2xl border ${colors.bg} ${colors.border} transition-all duration-300 cursor-default`}>
                                        <div className="text-2xl mb-3">{region.flag}</div>
                                        <p className="text-xs text-gray-400 font-bold mb-1">{region.name}</p>
                                        <div className={`text-2xl font-black ${colors.text}`}>
                                            {region.avgResponseTime !== null ? `${region.avgResponseTime}ms` : '—'}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${region.uptime >= 99 ? 'bg-emerald-500' : region.uptime >= 95 ? 'bg-amber-500' : 'bg-red-500'}`} />
                                            <span className="text-[10px] text-gray-500 font-bold">
                                                {region.totalPings > 0 ? `${region.uptime}% up` : 'No data'}
                                            </span>
                                        </div>
                                        {region.avgResponseTime !== null && (
                                            <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(100, (region.avgResponseTime / 600) * 100)}%` }}
                                                    transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                                                    className="h-full rounded-full"
                                                    style={{ background: region.avgResponseTime < 200 ? '#10b981' : region.avgResponseTime < 400 ? '#f59e0b' : '#ef4444' }}
                                                />
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                    </div>
                </motion.div>

                {/* ─── Incidents Table ─────────────────────────────────────── */}
                <motion.div variants={itemVariants} className="mb-12">
                    <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 tracking-tight">
                        <AlertCircle className="w-6 h-6 text-red-500" /> Recent Incidents
                    </h2>
                    <div className="glass-card overflow-hidden border border-white/[0.05]">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5">Started</th>
                                    <th className="px-8 py-5">Duration</th>
                                    <th className="px-8 py-5">Reason</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.05]">
                                {incidents.length === 0 ? (
                                    <tr><td colSpan={4} className="px-8 py-12 text-center text-gray-500 italic font-medium">No incidents recorded yet.</td></tr>
                                ) : incidents.map((incident: any) => (
                                    <tr key={incident._id} className="text-sm hover:bg-white/[0.02] transition-colors">
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest ${incident.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {incident.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-white font-semibold">{format(new Date(incident.startTime), 'MMM d, h:mm aa')}</td>
                                        <td className="px-8 py-5 text-gray-400 font-medium">{incident.duration ? `${incident.duration}m` : 'Ongoing'}</td>
                                        <td className="px-8 py-5 text-gray-400 font-mono text-xs">{incident.reason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* ─── Logs Table ──────────────────────────────────────────── */}
                <motion.div variants={itemVariants}>
                    <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 tracking-tight">
                        <Database className="w-6 h-6 text-blue-500" /> Recent Ping Logs
                    </h2>
                    <div className="glass-card overflow-hidden border border-white/[0.05]">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                    <th className="px-8 py-5">Result</th>
                                    <th className="px-8 py-5">Code</th>
                                    <th className="px-8 py-5">Time</th>
                                    <th className="px-8 py-5">Latency</th>
                                    <th className="px-8 py-5">Assertions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.05]">
                                {logs.map((log: any) => {
                                    const assertPassed = log.assertionResults?.length > 0 && log.assertionResults.every((r: any) => r.passed);
                                    const assertFailed = log.assertionResults?.some((r: any) => r.passed === false);
                                    return (
                                        <tr key={log._id} className="text-sm hover:bg-white/[0.02] transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${log.status === 'UP' ? 'bg-emerald-500' : log.status === 'DEGRADED' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                                    <span className="text-white font-bold">{log.status}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-gray-400 font-mono text-xs">{log.statusCode || '--'}</td>
                                            <td className="px-8 py-5 text-gray-400 font-medium">{formatDistanceToNow(new Date(log.checkedAt), { addSuffix: true })}</td>
                                            <td className={`px-8 py-5 font-black ${log.responseTime > 500 ? 'text-amber-500' : 'text-emerald-500/80'}`}>{log.responseTime}ms</td>
                                            <td className="px-8 py-5">
                                                {log.assertionResults?.length > 0 ? (
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest ${assertPassed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                        {assertPassed ? `${log.assertionResults.length} PASS` : `${log.assertionResults.filter((r: any) => !r.passed).length} FAIL`}
                                                    </span>
                                                ) : <span className="text-gray-700 text-xs">—</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>

            {/* ─── Edit Monitor Slide-over ──────────────────────────────── */}
            <AnimatePresence>
                {isEditing && editForm && (
                    <>
                        {/* Backdrop */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsEditing(false)}
                            className="fixed inset-0 z-40"
                            style={{ background: 'rgba(3,3,3,0.75)', backdropFilter: 'blur(6px)' }} />

                        {/* Panel slides in from right */}
                        <motion.div
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
                            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md flex flex-col overflow-hidden"
                            style={{ background: '#0c0c0e', borderLeft: '1px solid rgba(255,255,255,0.08)', boxShadow: '-24px 0 80px rgba(0,0,0,0.6)' }}>

                            {/* Glow */}
                            <div className="absolute top-0 left-0 w-64 h-64 pointer-events-none rounded-full"
                                style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />

                            {/* Panel header */}
                            <div className="relative z-10 flex items-center gap-3 px-6 py-5"
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 4px 16px rgba(59,130,246,0.25)' }}>
                                    <Pencil className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-base font-black text-white">Edit Monitor</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Changes take effect on next ping</p>
                                </div>
                                <button onClick={() => setIsEditing(false)}
                                    className="p-1.5 rounded-lg text-gray-600 hover:text-white transition-all"
                                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Sub-tabs */}
                            <div className="relative z-10 flex gap-1 px-6 py-3"
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                {(['basic', 'advanced'] as const).map((tab) => (
                                    <button key={tab} type="button" onClick={() => setEditTab(tab)}
                                        className="px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all"
                                        style={editTab === tab ? {
                                            background: 'linear-gradient(135deg,rgba(59,130,246,0.85),rgba(99,102,241,0.85))',
                                            color: 'white', boxShadow: '0 4px 16px rgba(59,130,246,0.2)',
                                        } : { color: '#6b7280', background: 'transparent' }}>
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden relative z-10">
                                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                                    {editTab === 'basic' && (
                                        <>
                                            {/* Method selector — the main feature of this panel */}
                                            <div>
                                                <label className={LABEL}>HTTP Method</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'].map((m) => {
                                                        const isActive = editForm.method === m;
                                                        const color = METHOD_COLORS[m];
                                                        return (
                                                            <button key={m} type="button"
                                                                onClick={() => setEditForm({ ...editForm, method: m })}
                                                                className="py-2.5 rounded-xl text-sm font-black tracking-widest transition-all duration-200"
                                                                style={isActive ? {
                                                                    background: `${color}22`,
                                                                    color: color,
                                                                    border: `2px solid ${color}60`,
                                                                    boxShadow: `0 0 20px ${color}18`,
                                                                } : {
                                                                    background: 'rgba(255,255,255,0.03)',
                                                                    color: '#6b7280',
                                                                    border: '1px solid rgba(255,255,255,0.07)',
                                                                }}>
                                                                {m}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div>
                                                <label className={LABEL}>Friendly Name</label>
                                                <input type="text" required value={editForm.name}
                                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                    className={INPUT} style={INPUT_STYLE} placeholder="Monitor name" />
                                            </div>
                                            <div>
                                                <label className={LABEL}>Endpoint URL</label>
                                                <input type="url" required value={editForm.url}
                                                    onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                                                    className={INPUT + ' font-mono text-xs'} style={INPUT_STYLE} placeholder="https://..." />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className={LABEL}>Expected Status</label>
                                                    <input type="number" value={editForm.expectedStatus}
                                                        onChange={(e) => setEditForm({ ...editForm, expectedStatus: parseInt(e.target.value) })}
                                                        className={INPUT} style={INPUT_STYLE} />
                                                </div>
                                                <div>
                                                    <label className={LABEL}>Interval (min)</label>
                                                    <select value={editForm.interval} style={{ ...SELECT_ARROW, ...INPUT_STYLE }}
                                                        onChange={(e) => setEditForm({ ...editForm, interval: parseInt(e.target.value) })}
                                                        className={INPUT + ' appearance-none pr-9 cursor-pointer'}>
                                                        <option value={1} className="bg-[#0d0d0d]">1 min</option>
                                                        <option value={5} className="bg-[#0d0d0d]">5 min</option>
                                                        <option value={15} className="bg-[#0d0d0d]">15 min</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className={LABEL}>Alert Email</label>
                                                <input type="email" value={editForm.alertEmail}
                                                    onChange={(e) => setEditForm({ ...editForm, alertEmail: e.target.value })}
                                                    className={INPUT} style={INPUT_STYLE} placeholder="alerts@company.com" />
                                            </div>
                                        </>
                                    )}

                                    {editTab === 'advanced' && (
                                        <div className="space-y-6">
                                            <KVEditor label="Request Headers" pairs={editForm.headers}
                                                onChange={(h) => setEditForm({ ...editForm, headers: h })} />
                                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
                                            <KVEditor label="Query Parameters" pairs={editForm.queryParams}
                                                onChange={(q) => setEditForm({ ...editForm, queryParams: q })} />
                                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
                                            <div>
                                                <label className={LABEL}>Request Body (JSON)</label>
                                                <textarea rows={6} value={editForm.body}
                                                    onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                                                    placeholder={'{\n  "key": "value"\n}'}
                                                    className={INPUT + ' font-mono text-xs resize-none leading-relaxed'}
                                                    style={INPUT_STYLE} />
                                                <p className="text-[11px] text-gray-600 mt-1.5 ml-1">Only sent for POST, PUT and PATCH.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Save footer */}
                                <div className="px-6 py-4 relative z-10 flex gap-3"
                                    style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                                    <button type="button" onClick={() => setIsEditing(false)}
                                        className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-400 hover:text-white transition-all"
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={saving}
                                        className="flex-1 py-3 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                                        style={{ background: saveSuccess ? 'rgba(16,185,129,0.8)' : 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 4px 20px rgba(59,130,246,0.25)' }}>
                                        {saveSuccess ? (
                                            <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                                        ) : saving ? (
                                            'Saving...'
                                        ) : (
                                            <><Save className="w-4 h-4" /> Save Changes</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
