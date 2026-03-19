'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/services/api';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Globe, ShieldCheck, ShieldX, ShieldAlert,
    AlertTriangle, RefreshCw, Trash2, Pause, Play, Lock, Calendar, Clock
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';

// ── Status helpers ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { icon: any; label: string; color: string; bg: string; border: string }> = {
    VALID:         { icon: ShieldCheck,  label: 'VALID',         color: 'text-emerald-400', bg: 'bg-emerald-500/10',  border: 'border-emerald-500/20' },
    EXPIRING_SOON: { icon: AlertTriangle,label: 'EXPIRING SOON', color: 'text-amber-400',   bg: 'bg-amber-500/10',    border: 'border-amber-500/20'   },
    EXPIRED:       { icon: ShieldX,      label: 'EXPIRED',       color: 'text-red-400',      bg: 'bg-red-500/10',      border: 'border-red-500/20'     },
    ERROR:         { icon: ShieldAlert,  label: 'ERROR',         color: 'text-red-400',      bg: 'bg-red-500/10',      border: 'border-red-500/20'     },
    PENDING:       { icon: RefreshCw,    label: 'CHECKING',      color: 'text-gray-400',     bg: 'bg-white/5',         border: 'border-white/10'       },
};

const getDaysColor = (days: number | null) => {
    if (days === null) return 'text-gray-500';
    if (days <= 0)  return 'text-red-400';
    if (days <= 7)  return 'text-red-400';
    if (days <= 15) return 'text-amber-400';
    if (days <= 30) return 'text-amber-300';
    return 'text-emerald-400';
};

const ALERT_MILESTONES = [
    { days: 30, label: '30 days', color: 'text-teal-400',   bg: 'bg-teal-500/10',  border: 'border-teal-500/20'  },
    { days: 15, label: '15 days', color: 'text-amber-400',  bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { days: 7,  label: '7 days',  color: 'text-orange-400', bg: 'bg-orange-500/10',border: 'border-orange-500/20'},
    { days: 1,  label: '1 day',   color: 'text-red-400',    bg: 'bg-red-500/10',   border: 'border-red-500/20'   },
    { days: 0,  label: 'Expired', color: 'text-red-400',    bg: 'bg-red-500/10',   border: 'border-red-500/20'   },
];

const getSslUrl = (path: string) => {
    let base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    base = base.replace(/\/apis$/, '');
    return `${base}/ssl${path}`;
};

export default function SslDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const [monitor, setMonitor] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [rechecking, setRechecking] = useState(false);

    const fetchMonitor = useCallback(async () => {
        try {
            const { data } = await api.get(getSslUrl(`/${params.id}`));
            setMonitor(data);
        } catch (err) {
            console.error('Failed to fetch SSL monitor', err);
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    useEffect(() => { fetchMonitor(); }, [fetchMonitor]);

    const handleRecheck = async () => {
        setRechecking(true);
        try {
            const { data } = await api.post(getSslUrl(`/${params.id}/recheck`));
            setMonitor(data);
            showToast('Certificate re-checked successfully', 'success');
        } catch (err) {
            showToast('Failed to re-check certificate', 'error');
        } finally {
            setRechecking(false);
        }
    };

    const handleToggle = async () => {
        try {
            const { data } = await api.patch(getSslUrl(`/${params.id}/toggle`));
            setMonitor(data);
            showToast(data.isActive ? 'Monitor resumed' : 'Monitor paused', 'success');
        } catch (err) {
            showToast('Failed to toggle monitor', 'error');
        }
    };

    const handleDelete = () => {
        confirm({
            title: 'Delete SSL Monitor',
            message: 'Are you sure you want to delete this SSL monitor? All data will be lost permanently.',
            confirmText: 'Delete',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(getSslUrl(`/${params.id}`));
                    showToast('SSL monitor deleted', 'success');
                    router.push('/dashboard/ssl');
                } catch {
                    showToast('Failed to delete monitor', 'error');
                }
            },
        });
    };

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (loading) return (
        <div className="max-w-4xl mx-auto p-10">
            <div className="h-5 w-28 bg-white/5 rounded-full mb-8 animate-pulse" />
            <div className="h-12 w-64 bg-white/10 rounded-2xl animate-pulse mb-12" />
            <div className="grid grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-36 bg-white/5 rounded-3xl animate-pulse" />)}
            </div>
        </div>
    );

    if (!monitor) return (
        <div className="p-10 text-white">SSL monitor not found.</div>
    );

    const cfg = STATUS_CONFIG[monitor.status] || STATUS_CONFIG.PENDING;
    const Icon = cfg.icon;
    const daysColor = getDaysColor(monitor.daysRemaining);

    const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 26, stiffness: 110 } } };

    return (
        <motion.div initial="hidden" animate="show" variants={containerVariants} className="max-w-4xl mx-auto p-10">

            {/* ─── Back ─────────────────────────────────────────────────── */}
            <motion.div variants={itemVariants}>
                <button onClick={() => router.push('/dashboard/ssl')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to SSL Monitors
                </button>
            </motion.div>

            {/* ─── Header ───────────────────────────────────────────────── */}
            <motion.header variants={itemVariants} className="flex justify-between items-start mb-10">
                <div>
                    <div className="flex items-center gap-4 mb-3 flex-wrap">
                        <h1 className="text-5xl font-black text-white tracking-tighter">{monitor.name}</h1>
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${cfg.bg} ${cfg.border}`}>
                            <Icon className={`w-4 h-4 ${cfg.color}`} />
                            <span className={`text-xs font-black tracking-widest ${cfg.color}`}>{cfg.label}</span>
                        </div>
                    </div>
                    <p className="text-gray-500 font-medium flex items-center gap-2 px-1">
                        <Globe className="w-4 h-4 text-teal-500/50" />
                        <span className="font-mono text-sm">{monitor.domain}</span>
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap justify-end">
                    <button id="tour-ssl-recheck" onClick={handleRecheck} disabled={rechecking}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all border text-teal-400 border-teal-500/20 hover:bg-teal-500/10 disabled:opacity-50">
                        <RefreshCw className={`w-4 h-4 ${rechecking ? 'animate-spin' : ''}`} />
                        {rechecking ? 'Checking...' : 'Re-check'}
                    </button>
                    <button onClick={handleToggle}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all border ${
                            monitor.isActive
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
            </motion.header>

            {/* ─── Days remaining hero ───────────────────────────────────── */}
            <motion.div id="tour-ssl-days" variants={itemVariants} className="glass-card border border-white/[0.06] p-8 mb-8 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none" style={{
                    background: `radial-gradient(ellipse at 80% 50%, ${
                        monitor.status === 'ERROR' ? 'rgba(239,68,68,0.07)' :
                        monitor.daysRemaining !== null && monitor.daysRemaining <= 0 ? 'rgba(239,68,68,0.07)' :
                        monitor.daysRemaining !== null && monitor.daysRemaining <= 15 ? 'rgba(245,158,11,0.07)' :
                        'rgba(13,148,136,0.07)'
                    } 0%, transparent 70%)`
                }} />
                <div className="relative flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-3">Days Until Expiry</p>
                        <div className={`text-8xl font-black tracking-tighter ${daysColor}`}>
                            {monitor.status === 'ERROR' ? 'ERR' :
                             monitor.daysRemaining !== null
                                ? monitor.daysRemaining <= 0 ? '0' : monitor.daysRemaining
                                : '—'}
                        </div>
                        <p className="text-gray-500 font-bold mt-2">
                             {monitor.status === 'ERROR' ? 'Failed to check certificate' :
                              monitor.daysRemaining === null ? 'Not yet checked' :
                              monitor.daysRemaining <= 0 ? 'Certificate has expired!' :
                              `Certificate expires ${formatDistanceToNow(new Date(monitor.validTo), { addSuffix: true })}`}
                        </p>
                    </div>
                    <div className="text-right">
                        {monitor.status === 'ERROR' ? (
                             <ShieldAlert className={`w-24 h-24 opacity-10 ${daysColor}`} />
                        ) : (
                             <Lock className={`w-24 h-24 opacity-10 ${daysColor}`} />
                        )}
                    </div>
                </div>
                
                {/* Error Details */}
                {monitor.status === 'ERROR' && (
                    <div className="mt-6 p-4 rounded-2xl bg-red-500/5 border border-red-500/15">
                        <div className="flex items-start gap-3">
                            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-red-400 font-bold text-sm mb-1">Check Failed</h4>
                                <p className="text-red-400/80 text-xs font-medium">
                                    {monitor.lastError || 'Could not connect to domain on port 443. Check if the server is reachable and HTTPS is configured correctly.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Progress bar */}
                {monitor.status !== 'ERROR' && monitor.daysRemaining !== null && monitor.daysRemaining > 0 && (
                    <div className="mt-6 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (monitor.daysRemaining / 365) * 100)}%` }}
                            transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{
                                background: monitor.daysRemaining <= 7 ? 'linear-gradient(90deg, #ef4444, #dc2626)' :
                                            monitor.daysRemaining <= 30 ? 'linear-gradient(90deg, #f59e0b, #d97706)' :
                                            'linear-gradient(90deg, #0d9488, #0891b2)'
                            }}
                        />
                    </div>
                )}
            </motion.div>

            {/* ─── Cert details grid ─────────────────────────────────────── */}
            <motion.div id="tour-ssl-details" variants={itemVariants} className="grid grid-cols-2 gap-6 mb-8">
                {[
                    { label: 'Issuer', value: monitor.issuer || '—', icon: ShieldCheck, color: 'text-teal-400' },
                    { label: 'Organisation', value: monitor.issuerOrg || '—', icon: Globe, color: 'text-blue-400' },
                    {
                        label: 'Valid From',
                        value: monitor.validFrom ? format(new Date(monitor.validFrom), 'MMM d, yyyy') : '—',
                        icon: Calendar,
                        color: 'text-emerald-400'
                    },
                    {
                        label: 'Expires On',
                        value: monitor.validTo ? format(new Date(monitor.validTo), 'MMM d, yyyy') : '—',
                        icon: Calendar,
                        color: monitor.daysRemaining !== null && monitor.daysRemaining <= 30 ? 'text-amber-400' : 'text-purple-400'
                    },
                ].map((item, i) => (
                    <motion.div key={i} whileHover={{ y: -3 }}
                        className="glass-card p-6 border border-white/[0.05] hover:border-white/[0.1] transition-colors">
                        <div className="flex items-center gap-2 mb-3">
                            <item.icon className={`w-4 h-4 ${item.color}`} />
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{item.label}</p>
                        </div>
                        <p className="text-lg font-black text-white">{item.value}</p>
                    </motion.div>
                ))}
            </motion.div>

            {/* ─── Chain validity + last checked ────────────────────────── */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6 mb-8">
                <div className="glass-card p-6 border border-white/[0.05]">
                    <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className="w-4 h-4 text-gray-400" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Certificate Chain</p>
                    </div>
                    {monitor.isChainValid !== null ? (
                        <div className={`flex items-center gap-2 ${monitor.isChainValid ? 'text-emerald-400' : 'text-red-400'}`}>
                            {monitor.isChainValid
                                ? <><ShieldCheck className="w-5 h-5" /><span className="font-black text-lg">Valid Chain</span></>
                                : <><ShieldX className="w-5 h-5" /><span className="font-black text-lg">Invalid Chain</span></>
                            }
                        </div>
                    ) : (
                        <p className="text-gray-500 font-bold">—</p>
                    )}
                </div>

                <div className="glass-card p-6 border border-white/[0.05]">
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Last Checked</p>
                    </div>
                    <p className="text-lg font-black text-white">
                        {monitor.lastChecked
                            ? formatDistanceToNow(new Date(monitor.lastChecked), { addSuffix: true })
                            : 'Never'}
                    </p>
                    {monitor.lastChecked && (
                        <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(monitor.lastChecked), 'MMM d, yyyy · HH:mm')}
                        </p>
                    )}
                </div>
            </motion.div>

            {/* ─── Alert schedule ────────────────────────────────────────── */}
            <motion.div id="tour-ssl-alerts" variants={itemVariants} className="glass-card border border-white/[0.05] p-6">
                <h2 className="text-lg font-black text-white mb-5 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" /> Alert Schedule
                </h2>
                <div className="flex flex-wrap gap-3">
                    {ALERT_MILESTONES.map(m => {
                        const alerted = monitor.lastAlertDays !== null && monitor.lastAlertDays <= m.days;
                        return (
                            <div key={m.days}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-sm transition-all ${
                                    alerted
                                        ? `${m.bg} ${m.border} ${m.color}`
                                        : 'bg-white/[0.02] border-white/[0.06] text-gray-600'
                                }`}>
                                {alerted && <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                                {m.label}
                                {alerted && <span className="text-[9px] font-black tracking-widest opacity-60">SENT</span>}
                            </div>
                        );
                    })}
                </div>
                <p className="text-[11px] text-gray-600 mt-4">
                    Alerts are sent once per threshold. Each milestone alert is sent only when first crossed.
                </p>
            </motion.div>
        </motion.div>
    );
}
