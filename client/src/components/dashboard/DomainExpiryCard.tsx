'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Globe, Pencil, Trash2, Play, Pause, ArrowUpRight, Wrench } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

interface DomainMonitor {
    _id: string;
    name: string;
    domain: string;
    daysRemaining?: number;
    whoisData?: {
        registrar?: string;
        expiryDate?: string;
    };
    lastCheckedAt?: string;
    isActive: boolean;
    inMaintenance?: boolean;
}

interface DomainExpiryCardProps {
    monitor: DomainMonitor;
    onClick: () => void;
    onEdit?: (e: React.MouseEvent) => void;
    onTogglePause?: (e: React.MouseEvent) => void;
    onDelete?: (e: React.MouseEvent) => void;
}

const getDaysColor = (days: number | undefined | null) => {
    if (days === null || days === undefined) return {
        text: 'text-gray-500',
        bg: 'bg-gray-500/10',
        border: 'border-gray-500/20',
        glow: 'rgba(107,114,128,0.06)'
    };
    if (days <= 0)  return {
        text: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        glow: 'rgba(239,68,68,0.08)'
    };
    if (days <= 7)  return {
        text: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        glow: 'rgba(239,68,68,0.08)'
    };
    if (days <= 15) return {
        text: 'text-orange-400',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
        glow: 'rgba(249,115,22,0.08)'
    };
    if (days <= 30) return {
        text: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        glow: 'rgba(245,158,11,0.06)'
    };
    if (days <= 60) return {
        text: 'text-yellow-400',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
        glow: 'rgba(234,179,8,0.06)'
    };
    return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        glow: 'rgba(16,185,129,0.06)'
    };
};

export default function DomainExpiryCard({ monitor, onClick, onEdit, onTogglePause, onDelete }: DomainExpiryCardProps) {
    const { isAtLeast } = useAuth();
    const days = monitor.daysRemaining;
    const colors = getDaysColor(days);

    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: 'spring', damping: 22, stiffness: 220 }}
            onClick={onClick}
            className="glass-card border border-white/[0.06] hover:border-white/[0.12] relative overflow-hidden cursor-pointer group transition-colors"
            style={{ background: `radial-gradient(circle at top right, ${colors.glow} 0%, transparent 70%)` }}
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
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.bg} ${colors.border} border`}>
                                <Calendar className={`w-5 h-5 ${colors.text}`} />
                            </div>
                        </div>
                        <div className="min-w-0 flex-1 ml-2">
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
                                {onEdit && (
                                    <button
                                        onClick={onEdit}
                                        className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                                        title="Edit"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                )}
                            </>
                        )}
                        <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center group-hover:bg-white/10 transition-all group-hover:rotate-45">
                            <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                        </div>
                    </div>
                </div>

                <div className={`mb-5 p-4 rounded-2xl border ${colors.bg} ${colors.border}`}>
                    <div className="flex items-end justify-between">
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${colors.text} opacity-80`}>Days Remaining</p>
                            <p className={`text-4xl font-black tracking-tight ${colors.text}`}>
                                {days !== null && days !== undefined
                                    ? days <= 0 ? 'EXPIRED' : days
                                    : 'PENDING'
                                }
                                {days !== null && days !== undefined && days > 0 && (
                                    <span className="text-sm font-bold ml-1.5 opacity-80">days</span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">Registrar</p>
                        <p className="text-xs font-bold text-gray-300 truncate">{monitor.whoisData?.registrar || '—'}</p>
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">Expires On</p>
                        <p className="text-xs font-bold text-gray-300 truncate">
                            {monitor.whoisData?.expiryDate ? format(new Date(monitor.whoisData.expiryDate), 'MMM d, yyyy') : '—'}
                        </p>
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
