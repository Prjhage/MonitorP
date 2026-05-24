'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, ShieldX, AlertTriangle, RotateCcw, Globe, Play, Pause, Trash2, ArrowUpRight, Wrench } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

interface SslMonitor {
    _id: string;
    name: string;
    domain: string;
    status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'ERROR' | 'PENDING';
    issuer?: string;
    validTo?: string;
    daysRemaining?: number;
    isChainValid?: boolean;
    lastChecked?: string;
    lastError?: string;
    isActive: boolean;
    inMaintenance?: boolean;
}

interface SslCardProps {
    monitor: SslMonitor;
    onClick: () => void;
    onTogglePause?: (e: React.MouseEvent) => void;
    onDelete?: (e: React.MouseEvent) => void;
}

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    VALID: {
        icon: ShieldCheck,
        label: 'VALID',
        textColor: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
        glowColor: 'rgba(16,185,129,0.06)',
        dotColor: 'bg-emerald-500',
    },
    EXPIRING_SOON: {
        icon: AlertTriangle,
        label: 'EXPIRING',
        textColor: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        glowColor: 'rgba(245,158,11,0.06)',
        dotColor: 'bg-amber-500',
    },
    EXPIRED: {
        icon: ShieldX,
        label: 'EXPIRED',
        textColor: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        glowColor: 'rgba(239,68,68,0.08)',
        dotColor: 'bg-red-500',
    },
    ERROR: {
        icon: ShieldAlert,
        label: 'ERROR',
        textColor: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        glowColor: 'rgba(239,68,68,0.08)',
        dotColor: 'bg-red-500',
    },
    PENDING: {
        icon: RotateCcw,
        label: 'CHECKING',
        textColor: 'text-gray-400',
        bgColor: 'bg-white/5',
        borderColor: 'border-white/10',
        glowColor: 'rgba(255,255,255,0.02)',
        dotColor: 'bg-gray-500',
    },
};

// Return urgency color for days-remaining display
const getDaysColor = (days: number | undefined | null) => {
    if (days === null || days === undefined) return 'text-gray-500';
    if (days <= 0)  return 'text-red-400';
    if (days <= 7)  return 'text-red-400';
    if (days <= 15) return 'text-amber-400';
    if (days <= 30) return 'text-amber-300';
    return 'text-emerald-400';
};

export default function SslCard({ monitor, onClick, onTogglePause, onDelete }: SslCardProps) {
    const { isAtLeast } = useAuth();
    const cfg = STATUS_CONFIG[monitor.status] || STATUS_CONFIG.PENDING;
    const Icon = cfg.icon;
    const daysColor = getDaysColor(monitor.daysRemaining);

    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: 'spring', damping: 22, stiffness: 220 }}
            onClick={onClick}
            className="glass-card border border-white/[0.06] hover:border-white/[0.12] relative overflow-hidden cursor-pointer group transition-colors"
            style={{ background: `radial-gradient(circle at top right, ${cfg.glowColor} 0%, transparent 70%)` }}
        >
            {/* Paused overlay */}
            {!monitor.isActive && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-black/60 px-3 py-1.5 rounded-full border border-white/10">
                        Paused
                    </span>
                </div>
            )}

            <div className="p-6">
                {/* ─ Header row ─────────────────────────────────────────── */}
                <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Status dot */}
                        <div className="relative shrink-0 mt-0.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${cfg.dotColor}`} />
                            {(monitor.status === 'VALID' || monitor.status === 'EXPIRING_SOON') && (
                                <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${cfg.dotColor} animate-ping opacity-50`} />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-white font-black text-base tracking-tight truncate group-hover:text-blue-300 transition-colors">
                                {monitor.name}
                            </h3>
                            <p className="text-gray-500 font-mono text-xs flex items-center gap-1 mt-0.5 truncate">
                                <Globe className="w-3 h-3 shrink-0" /> {monitor.domain}
                                {monitor.inMaintenance && (
                                    <span className="ml-2 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center gap-1">
                                        <Wrench className="w-2 h-2" /> Maintenance
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isAtLeast('admin') && (
                            <>
                                {onTogglePause && (
                                    <button
                                        onClick={onTogglePause}
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${
                                            !monitor.isActive
                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                                                : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                                        }`}
                                        title={!monitor.isActive ? 'Resume' : 'Pause'}
                                    >
                                        {!monitor.isActive ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={onDelete}
                                        className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </>
                        )}
                        <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center group-hover:bg-white/10 transition-all group-hover:rotate-45">
                            <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                        </div>
                    </div>
                </div>

                {/* ─ Days remaining  ─────────────────────────────────────── */}
                {monitor.status !== 'PENDING' && monitor.status !== 'ERROR' && (
                    <div className="mb-5 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Days Remaining</p>
                                <p className={`text-4xl font-black tracking-tight ${daysColor}`}>
                                    {monitor.daysRemaining !== null && monitor.daysRemaining !== undefined
                                        ? monitor.daysRemaining <= 0 ? 'EXPIRED' : monitor.daysRemaining
                                        : '—'
                                    }
                                    {monitor.daysRemaining !== null && monitor.daysRemaining !== undefined && monitor.daysRemaining > 0 && (
                                        <span className="text-sm font-bold text-gray-500 ml-1.5">days</span>
                                    )}
                                </p>
                            </div>
                            {/* Mini expiry bar */}
                            {monitor.daysRemaining !== null && monitor.daysRemaining !== undefined && monitor.daysRemaining > 0 && (
                                <div className="flex flex-col items-end gap-1">
                                    <p className="text-[10px] text-gray-600 font-medium">of ~90 days</p>
                                    <div className="w-20 h-1.5 rounded-full overflow-hidden bg-white/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (monitor.daysRemaining / 90) * 100)}%` }}
                                            transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
                                            className={`h-full rounded-full ${
                                                monitor.daysRemaining <= 7 ? 'bg-red-500' :
                                                monitor.daysRemaining <= 15 ? 'bg-amber-500' :
                                                monitor.daysRemaining <= 30 ? 'bg-amber-400' : 'bg-emerald-500'
                                            }`}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Error state message */}
                {monitor.status === 'ERROR' && (
                    <div className="mb-5 p-4 rounded-2xl bg-red-500/5 border border-red-500/15">
                        <p className="text-[11px] text-red-400/80 font-medium">
                            {monitor.lastError || 'Could not retrieve certificate. Check domain is accessible on port 443.'}
                        </p>
                    </div>
                )}

                {/* ─ Cert details grid ─────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">Issuer</p>
                        <p className="text-xs font-bold text-gray-300 truncate">{monitor.issuer || '—'}</p>
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">Expires</p>
                        <p className="text-xs font-bold text-gray-300">
                            {monitor.validTo ? format(new Date(monitor.validTo), 'MMM d, yyyy') : '—'}
                        </p>
                    </div>
                </div>

                {/* ─ Footer ───────────────────────────────────────────────── */}
                <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <span className="text-[10px] text-gray-600 font-medium">
                        {monitor.lastChecked
                            ? `Checked ${formatDistanceToNow(new Date(monitor.lastChecked), { addSuffix: true })}`
                            : 'Not yet checked'
                        }
                    </span>
                    {monitor.isChainValid !== null && monitor.isChainValid !== undefined && (
                        <span className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded-md ${
                            monitor.isChainValid
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-red-500/10 text-red-400'
                        }`}>
                            {monitor.isChainValid ? 'CHAIN VALID' : 'CHAIN INVALID'}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
