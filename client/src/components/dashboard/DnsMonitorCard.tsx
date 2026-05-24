'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, RotateCcw, Globe, Play, Pause, Trash2, ArrowUpRight, Wrench } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

interface DnsMonitor {
    _id: string;
    name: string;
    domain: string;
    recordTypes: string[];
    status: 'ok' | 'changed' | 'failed' | 'pending';
    lastCheckedAt?: string;
    isActive: boolean;
    inMaintenance?: boolean;
}

interface DnsMonitorCardProps {
    monitor: DnsMonitor;
    onClick: () => void;
    onTogglePause?: (e: React.MouseEvent) => void;
    onDelete?: (e: React.MouseEvent) => void;
}

const STATUS_CONFIG = {
    ok: {
        icon: ShieldCheck,
        label: 'OK',
        textColor: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
        glowColor: 'rgba(16,185,129,0.06)',
        dotColor: 'bg-emerald-500',
    },
    changed: {
        icon: ShieldAlert,
        label: 'CHANGED',
        textColor: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        glowColor: 'rgba(245,158,11,0.06)',
        dotColor: 'bg-amber-500',
    },
    failed: {
        icon: ShieldAlert,
        label: 'FAILED',
        textColor: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        glowColor: 'rgba(239,68,68,0.08)',
        dotColor: 'bg-red-500',
    },
    pending: {
        icon: RotateCcw,
        label: 'PENDING',
        textColor: 'text-gray-400',
        bgColor: 'bg-white/5',
        borderColor: 'border-white/10',
        glowColor: 'rgba(255,255,255,0.02)',
        dotColor: 'bg-gray-500',
    },
};

export default function DnsMonitorCard({ monitor, onClick, onTogglePause, onDelete }: DnsMonitorCardProps) {
    const { isAtLeast } = useAuth();
    const cfg = STATUS_CONFIG[monitor.status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;

    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: 'spring', damping: 22, stiffness: 220 }}
            onClick={onClick}
            className="glass-card border border-white/[0.06] hover:border-white/[0.12] relative overflow-hidden cursor-pointer group transition-colors"
            style={{ background: `radial-gradient(circle at top right, ${cfg.glowColor} 0%, transparent 70%)` }}
        >
            {!monitor.isActive && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-black/60 px-3 py-1.5 rounded-full border border-white/10">
                        Paused
                    </span>
                </div>
            )}

            <div className="p-6">
                <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0 mt-0.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${cfg.dotColor}`} />
                            {monitor.status === 'ok' && (
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

                <div className="mb-5 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Monitored Records</p>
                     <div className="flex flex-wrap gap-2">
                         {monitor.recordTypes.map(type => (
                             <span key={type} className="px-2 py-0.5 text-xs font-bold font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-md">
                                 {type}
                             </span>
                         ))}
                     </div>
                </div>

                <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <span className="text-[10px] text-gray-600 font-medium">
                        {monitor.lastCheckedAt
                            ? `Checked ${formatDistanceToNow(new Date(monitor.lastCheckedAt), { addSuffix: true })}`
                            : 'Not yet checked'
                        }
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
