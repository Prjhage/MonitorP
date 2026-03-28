'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Lock, Globe, Activity, Clock } from 'lucide-react';

interface Monitor {
    id: string;
    name: string;
    url: string;
    status: string;
    responseTime: number | null;
    uptime: number;
    lastChecked: string;
    region: string;
    checks: number;
    downSince?: string;
}

const STATUS_CONFIG: Record<string, { dot: string; badge: string; label: string; border: string }> = {
    UP:       { dot: 'bg-emerald-400 animate-pulse', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Operational', border: 'border-white/[0.05]' },
    DOWN:     { dot: 'bg-red-500 animate-pulse',     badge: 'bg-red-500/10 text-red-400 border-red-500/20',           label: 'Down',        border: 'border-red-500/20' },
    DEGRADED: { dot: 'bg-amber-400',                 badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',     label: 'Degraded',    border: 'border-amber-500/20' },
};

export default function DemoAPICard({ monitor }: { monitor: Monitor }) {
    const [expanded, setExpanded] = useState(false);
    const config = STATUS_CONFIG[monitor.status] ?? STATUS_CONFIG.UP;

    return (
        <motion.div layout className={`bg-white/[0.02] border ${config.border} rounded-[20px] overflow-hidden transition-all`}>
            <div className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                    <div className="relative flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${config.dot}`} />
                        {monitor.status !== 'UP' && (
                            <div className={`absolute inset-0 w-3 h-3 rounded-full blur-sm ${config.dot}`} />
                        )}
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-white font-black text-sm truncate">{monitor.name}</h3>
                        <p className="text-gray-500 text-xs font-mono truncate">{monitor.url}</p>
                    </div>
                </div>

                <div className="flex items-center gap-5 flex-shrink-0">
                    <span className={`px-3 py-1 rounded-xl text-xs font-black border ${config.badge}`}>
                        {config.label}
                    </span>
                    {monitor.responseTime !== null && (
                        <div className="text-right hidden sm:block">
                            <div className="text-xs text-gray-600 font-black uppercase tracking-widest">Response</div>
                            <div className={`text-sm font-black ${monitor.responseTime > 1000 ? 'text-amber-400' : 'text-gray-200'}`}>
                                {monitor.responseTime}ms
                            </div>
                        </div>
                    )}
                    <div className="text-right hidden md:block">
                        <div className="text-xs text-gray-600 font-black uppercase tracking-widest">30d Uptime</div>
                        <div className="text-sm font-black text-gray-200">{monitor.uptime}%</div>
                    </div>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all"
                    >
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/[0.03] bg-white/[0.01]"
                    >
                        <div className="p-5">
                            <div className="grid grid-cols-3 gap-4 mb-5">
                                {[
                                    { icon: Clock, label: 'Last Checked', value: monitor.lastChecked },
                                    { icon: Activity, label: 'Total Checks', value: monitor.checks.toLocaleString() },
                                    { icon: Globe, label: 'Region', value: monitor.region },
                                ].map(({ icon: Icon, label, value }) => (
                                    <div key={label} className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.04]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Icon className="w-3.5 h-3.5 text-gray-600" />
                                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{label}</span>
                                        </div>
                                        <p className="text-white font-black text-sm">{value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Fake sparkline */}
                            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-4 mb-4">
                                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">Response Time (48h)</p>
                                <div className="h-12 flex items-end gap-[2px]">
                                    {Array.from({ length: 48 }, (_, i) => (
                                        <div key={i}
                                            style={{ height: `${Math.max(10, 30 + Math.sin(i * 0.4) * 25 + Math.random() * 20)}%` }}
                                            className={`flex-1 rounded-sm transition-all ${
                                                monitor.status === 'DOWN' && i > 38 ? 'bg-red-500/50' :
                                                monitor.status === 'DEGRADED' ? 'bg-amber-500/50' :
                                                'bg-blue-500/40'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Locked actions */}
                            <div className="flex gap-2">
                                {['Edit Monitor', 'View Full Report', 'Alert History'].map(label => (
                                    <button key={label}
                                        onClick={() => alert('Create a free account to access all PingForge features!')}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.03] border border-white/[0.05] text-gray-500 hover:text-gray-300 rounded-xl text-xs font-black transition-all"
                                    >
                                        <Lock className="w-3 h-3" /> {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
