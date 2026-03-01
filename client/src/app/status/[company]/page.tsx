'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Shield, CheckCircle2, AlertCircle, Clock, ExternalLink, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ─── Uptime Calendar (30 squares) ─────────────────────────────────────────────
function UptimeCalendar({ calendar }: { calendar: { date: string; uptime: number | null; avgResponseTime: number | null }[] }) {
    const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

    const getColor = (uptime: number | null) => {
        if (uptime === null) return 'bg-white/[0.05] border-white/[0.04]';
        if (uptime >= 99.9) return 'bg-emerald-500 border-emerald-400/50';
        if (uptime >= 99) return 'bg-emerald-500/70 border-emerald-500/40';
        if (uptime >= 95) return 'bg-amber-500/80 border-amber-500/50';
        if (uptime > 0) return 'bg-red-500/70 border-red-500/40';
        return 'bg-red-600 border-red-500/60';
    };

    return (
        <div className="relative">
            <div className="flex gap-[3px] flex-wrap">
                {calendar.map((day, i) => (
                    <div
                        key={i}
                        className={`w-[calc((100%-87px)/30)] aspect-square rounded-[3px] border cursor-default transition-all duration-200 hover:scale-125 hover:z-10 ${getColor(day.uptime)}`}
                        onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const parentRect = e.currentTarget.closest('.relative')?.getBoundingClientRect();
                            setTooltip({
                                x: rect.left - (parentRect?.left ?? 0) + rect.width / 2,
                                y: rect.top - (parentRect?.top ?? 0) - 10,
                                text: `${format(new Date(day.date), 'MMM d')}: ${day.uptime !== null ? `${day.uptime}% up` : 'No data'}${day.avgResponseTime ? ` · ${day.avgResponseTime}ms` : ''}`
                            });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                    />
                ))}
            </div>
            {tooltip && (
                <div style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
                    className="absolute z-50 pointer-events-none bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-medium whitespace-nowrap shadow-xl">
                    {tooltip.text}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#111]" />
                </div>
            )}
            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 justify-end">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <div className="w-3 h-3 rounded-[2px] bg-white/[0.05] border border-white/[0.04]" /> No data
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <div className="w-3 h-3 rounded-[2px] bg-amber-500/80" /> Degraded
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <div className="w-3 h-3 rounded-[2px] bg-red-600" /> Outage
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <div className="w-3 h-3 rounded-[2px] bg-emerald-500" /> Operational
                </div>
            </div>
        </div>
    );
}

// ─── SVG Sparkline ────────────────────────────────────────────────────────────
function Sparkline({ data }: { data: (number | null)[] }) {
    const valid = data.filter((d): d is number => d !== null);
    if (valid.length < 2) return <div className="h-10 text-xs text-gray-700 flex items-center">Not enough data</div>;

    const max = Math.max(...valid);
    const min = Math.min(...valid);
    const range = max - min || 1;
    const W = 200, H = 40;

    const points = data
        .map((v, i): [number, number] | null => v !== null ? [
            (i / (data.length - 1)) * W,
            H - ((v - min) / range) * (H - 4) - 2
        ] : null)
        .filter((p): p is [number, number] => p !== null);

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');

    return (
        <svg width={W} height={H} className="overflow-visible" style={{ width: '100%', maxWidth: W }}>
            <defs>
                <linearGradient id="spark-grad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={`${pathD} L ${points[points.length - 1][0]} ${H} L ${points[0][0]} ${H} Z`}
                fill="url(#spark-grad)" />
            <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
    );
}

// ─── Health Score Badge ───────────────────────────────────────────────────────
function HealthBadge({ score }: { score: number }) {
    const color = score >= 99 ? '#10b981' : score >= 95 ? '#f59e0b' : '#ef4444';
    const label = score >= 99 ? 'Excellent' : score >= 95 ? 'Degraded' : 'Critical';

    return (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', delay: 0.2 }}
            className="flex flex-col items-center gap-1">
            <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <motion.circle
                        cx="50" cy="50" r="44" fill="none"
                        stroke={color} strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 44}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 44 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 44 * (1 - score / 100) }}
                        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-white leading-none">{score}%</span>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">Health</span>
                </div>
            </div>
            <span style={{ color }} className="text-xs font-black uppercase tracking-widest">{label}</span>
        </motion.div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PublicStatusPage() {
    const params = useParams();
    const companyName = params.company ? decodeURIComponent(params.company as string) : '';
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (companyName) fetchStatus();
    }, [companyName]);

    const fetchStatus = async () => {
        try {
            const response = await axios.get(`${API_URL}/public/status/${companyName}`);
            setData(response.data);
        } catch (error) {
            console.error('Failed to fetch status', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
    );

    if (!data) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-16 h-16 text-gray-600 mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Status Page Not Found</h1>
            <p className="text-gray-500">The status page for "{companyName}" could not be found.</p>
        </div>
    );

    const allOperational = data.activeIncidents.length === 0;

    return (
        <div className="min-h-screen py-16 px-6 max-w-4xl mx-auto">

            {/* ─── Header ───────────────────────────────────────────────── */}
            <div className="flex flex-col items-center mb-16">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                        <Shield className="text-white w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">{data.companyName}</span>
                </div>

                {/* Health badge + overall status */}
                <div className="flex flex-col sm:flex-row items-center gap-8 mb-8">
                    <HealthBadge score={data.overallHealth ?? 100} />
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={`px-8 py-4 rounded-2xl flex items-center gap-3 border shadow-lg ${allOperational
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                            : 'bg-red-500/10 border-red-500/20 text-red-500'
                            }`}
                    >
                        {allOperational ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                        <span className="text-xl font-bold">
                            {allOperational ? 'All Systems Operational' : 'Partial System Outage'}
                        </span>
                    </motion.div>
                </div>
                <p className="text-xs text-gray-600">Last updated {format(new Date(), "MMM d, h:mm aa")}</p>
            </div>

            {/* ─── API Status + 30-day Calendar ─────────────────────────── */}
            <div className="glass-card overflow-hidden mb-12">
                <div className="p-6 border-b border-white/5 bg-white/5">
                    <h2 className="text-lg font-semibold text-white">Current Status & Uptime History</h2>
                    <p className="text-xs text-gray-500 mt-1">30-day uptime calendar — hover cells for details</p>
                </div>
                <div className="divide-y divide-white/5">
                    {data.apis.map((api: any) => {
                        const calendar: any[] = data.uptimeCalendar?.[api._id] ?? [];
                        const avgUptime = calendar.filter((d: any) => d.uptime !== null).length > 0
                            ? (calendar.reduce((acc: number, d: any) => acc + (d.uptime ?? 100), 0) / 30).toFixed(2)
                            : '100.00';
                        const rtData = calendar.map((d: any) => d.avgResponseTime as number | null);

                        return (
                            <motion.div key={api._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="p-6">
                                {/* Top row */}
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-white font-bold mb-0.5">{api.name}</h3>
                                        <p className="text-gray-500 text-sm font-mono truncate max-w-[240px] md:max-w-md">{api.url}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">30-day avg</div>
                                            <div className="text-lg font-black text-white">{avgUptime}%</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-semibold ${api.status === 'UP' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {api.status === 'UP' ? 'Operational' : 'Major Outage'}
                                            </span>
                                            <div className={`w-3 h-3 rounded-full ${api.status === 'UP' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                        </div>
                                    </div>
                                </div>

                                {/* Calendar */}
                                {calendar.length > 0 && <UptimeCalendar calendar={calendar} />}

                                {/* Sparkline */}
                                {rtData.some(v => v !== null) && (
                                    <div className="mt-4 pt-4 border-t border-white/[0.04]">
                                        <div className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <TrendingUp className="w-3 h-3 text-blue-500" /> Response Time Trend (30 days)
                                        </div>
                                        <Sparkline data={rtData} />
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                    {data.apis.length === 0 && (
                        <div className="p-12 text-center text-gray-500">No APIs being monitored.</div>
                    )}
                </div>
            </div>

            {/* ─── Active Incidents ──────────────────────────────────────── */}
            {!allOperational && (
                <div className="mb-12">
                    <h2 className="text-xl font-bold text-white mb-6">Active Incidents</h2>
                    <div className="space-y-4">
                        {data.activeIncidents.map((incident: any) => (
                            <div key={incident._id} className="border border-red-500/20 bg-red-500/5 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    <h3 className="text-lg font-bold text-white">{incident.apiId.name} Downtime</h3>
                                </div>
                                <p className="text-gray-400 mb-4">{incident.reason}</p>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Clock className="w-4 h-4" />
                                    Started {format(new Date(incident.startTime), 'MMM d, h:mm aa')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Incident History ──────────────────────────────────────── */}
            <div>
                <h2 className="text-xl font-bold text-white mb-6">Incident History (Last 7 Days)</h2>
                <div className="space-y-4">
                    {data.recentIncidents.length === 0 ? (
                        <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                            <p className="text-gray-500 italic">No incidents reported in the last 7 days.</p>
                        </div>
                    ) : (
                        data.recentIncidents.map((incident: any) => (
                            <div key={incident._id} className="glass-card p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-gray-400" />
                                        <h3 className="text-white font-medium">{incident.apiId.name} Outage</h3>
                                    </div>
                                    <span className="text-sm text-gray-500">{incident.duration} min duration</span>
                                </div>
                                <div className="text-sm text-gray-500">
                                    Resolved on {format(new Date(incident.endTime), 'MMM d, h:mm aa')}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ─── Footer ───────────────────────────────────────────────── */}
            <footer className="mt-20 pt-12 border-t border-white/5 flex flex-col items-center">
                <p className="text-gray-600 text-sm mb-4">Powered by</p>
                <Link href="/" className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                    <Shield className="w-5 h-5 text-blue-500" />
                    <span className="font-bold text-white tracking-tight">MonitorP</span>
                </Link>
            </footer>
        </div>
    );
}
