'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, CheckCircle2, AlertCircle, Clock, ExternalLink, 
  TrendingUp, Heart, Lock, ShieldCheck, Mail, Bell, 
  Wrench, ChevronRight, Check, Loader2, Info, Calendar
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ─── Subscriber Widget ────────────────────────────────────────────────────────
function SubscriberWidget({ companyName }: { companyName: string }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [subscribed, setSubscribed] = useState(false);
    const [error, setError] = useState('');

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axios.post(`${API_URL}/status-subscribers/subscribe`, {
                companyName,
                email
            });
            setSubscribed(true);
            setEmail('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to subscribe. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-blue-600/10 to-indigo-600/5 border border-blue-500/20 rounded-[32px] p-8 mb-12 relative overflow-hidden">
            {/* Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight">Stay Informed</h3>
                        <p className="text-gray-400 text-sm font-medium">Get email notifications for outages and maintenance.</p>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {subscribed ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3"
                        >
                            <Check className="w-5 h-5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold text-sm">You've been subscribed! Please check your inbox.</span>
                        </motion.div>
                    ) : (
                        <motion.form 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3"
                        >
                            <div className="flex-1 relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input 
                                    type="email" required placeholder="your@email.com"
                                    value={email} onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl pl-12 pr-4 py-3.5 text-white outline-none focus:border-blue-500/50 transition-all"
                                />
                            </div>
                            <button 
                                type="submit" disabled={loading}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Subscribe'}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>
                {error && <p className="text-red-400 text-xs font-bold mt-3 ml-1">{error}</p>}
            </div>
        </div>
    );
}

// ─── Uptime Calendar (30 squares) ─────────────────────────────────────────────
function UptimeCalendar({ calendar }: { calendar: { date: string; uptime: number | null }[] }) {
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
                                text: `${format(new Date(day.date), 'MMM d')}: ${day.uptime !== null ? `${day.uptime}% up` : 'No data'}`
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
        </div>
    );
}

// ─── Status Indicator ─────────────────────────────────────────────────────────
function StatusIndicator({ status, labelUp = "Operational", labelDown = "Outage" }: { status: string; labelUp?: string; labelDown?: string }) {
    const isUp = status === 'UP' || status === 'VALID';
    return (
        <div className="flex items-center gap-2">
            <span className={`text-xs font-black uppercase tracking-widest ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                {isUp ? labelUp : labelDown}
            </span>
            <div className={`w-2.5 h-2.5 rounded-full ${isUp ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse'}`} />
        </div>
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
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
    );

    if (!data) return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-16 h-16 text-gray-600 mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Status Page Not Found</h1>
            <p className="text-gray-500">The status page for "{companyName}" could not be found.</p>
        </div>
    );

    const allOperational = data.activeIncidents.length === 0;

    return (
        <div className="min-h-screen bg-[#0a0a0a] py-16 px-6">
            <div className="max-w-4xl mx-auto">
                {/* ─── Header ───────────────────────────────────────────────── */}
                <div className="flex flex-col items-center mb-16">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Shield className="text-white w-6 h-6" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-white uppercase">{data.companyName}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-12 mb-8">
                        <HealthBadge score={data.overallHealth ?? 100} />
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className={`px-10 py-5 rounded-[24px] flex items-center gap-4 border shadow-2xl ${allOperational
                                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'
                                : 'bg-red-500/5 border-red-500/20 text-red-500'
                                }`}
                        >
                            {allOperational ? <CheckCircle2 className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
                            <span className="text-2xl font-black tracking-tight">
                                {allOperational ? 'Systems Operational' : 'Incident in Progress'}
                            </span>
                        </motion.div>
                    </div>
                </div>

                {/* ─── Subscription Widget ──────────────────────────────────── */}
                <SubscriberWidget companyName={companyName} />

                {/* ─── Maintenance Banner ───────────────────────────────────── */}
                {data.maintenanceWindows?.some((w: any) => {
                    const now = new Date();
                    return now >= new Date(w.startTime) && now <= new Date(w.endTime);
                }) && (
                    <div className="mb-12 bg-amber-500/10 border border-amber-500/30 rounded-[28px] p-6 flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
                            <Wrench className="w-6 h-6 text-amber-500" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-amber-500 font-black text-sm uppercase tracking-wider mb-0.5">Scheduled Maintenance Live</h4>
                            <p className="text-gray-400 text-sm font-medium">We are currently performing system updates. Some metrics may be temporarily delayed.</p>
                        </div>
                    </div>
                )}

                {/* ─── API Status ─────────────────────────────────────────── */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        <h2 className="text-xl font-black text-white uppercase tracking-wider">Public Endpoints</h2>
                    </div>
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-[32px] overflow-hidden divide-y divide-white/[0.03]">
                        {data.apis.map((api: any) => {
                            const calendar = data.uptimeCalendar?.[api._id] ?? [];
                            return (
                                <div key={api._id} className="p-8 hover:bg-white/[0.01] transition-colors">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-lg font-black text-white mb-1">{api.name}</h3>
                                            <p className="text-gray-500 text-xs font-mono truncate max-w-xs">{api.url}</p>
                                        </div>
                                        <StatusIndicator status={api.status} />
                                    </div>
                                    <UptimeCalendar calendar={calendar} />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ─── Maintenance Windows ──────────────────────────────────── */}
                {data.maintenanceWindows?.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-6 px-2">
                            <Calendar className="w-5 h-5 text-amber-500" />
                            <h2 className="text-xl font-black text-white uppercase tracking-wider">Upcoming Maintenance</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {data.maintenanceWindows.map((w: any) => (
                                <div key={w._id} className="bg-white/[0.02] border border-white/[0.05] rounded-[24px] p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                            <Wrench className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-black">{w.name}</h3>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                                                {format(new Date(w.startTime), 'MMM d, h:mm aa')} — {format(new Date(w.endTime), 'h:mm aa')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                        Scheduled
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── Heartbeat Section ──────────────────────────────────── */}
                {data.heartbeats?.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-6 px-2">
                            <Heart className="w-5 h-5 text-pink-500" />
                            <h2 className="text-xl font-black text-white uppercase tracking-wider">Background Jobs</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data.heartbeats.map((hb: any) => (
                                <div key={hb._id} className="bg-white/[0.02] border border-white/[0.05] rounded-[24px] p-6 flex items-center justify-between">
                                    <div className="min-w-0">
                                        <h3 className="text-white font-black truncate">{hb.name}</h3>
                                        <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-widest">
                                            {hb.lastPingAt ? `Checked in ${formatDistanceToNow(new Date(hb.lastPingAt))} ago` : 'Never pinged'}
                                        </p>
                                    </div>
                                    <StatusIndicator status={hb.status} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── SSL Status ─────────────────────────────────────────── */}
                {data.sslMonitors?.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-6 px-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            <h2 className="text-xl font-black text-white uppercase tracking-wider">Security & Certificates</h2>
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.05] rounded-[32px] overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.03] border-b border-white/[0.05]">
                                    <tr>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Domain</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Expiry</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.03]">
                                    {data.sslMonitors.map((ssl: any) => (
                                        <tr key={ssl._id} className="hover:bg-white/[0.01] transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="text-white font-black">{ssl.domain}</div>
                                                <div className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">{ssl.name}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={`text-sm font-black ${ssl.daysRemaining < 7 ? 'text-red-500' : ssl.daysRemaining < 30 ? 'text-amber-500' : 'text-gray-400'}`}>
                                                    {ssl.daysRemaining} days left
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <StatusIndicator status={ssl.status} labelUp="Valid" labelDown="Warning" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ─── Active Incidents ──────────────────────────────────────── */}
                {!allOperational && (
                    <div className="mb-12">
                        <h2 className="text-xl font-black text-white mb-6 uppercase tracking-wider px-2">Active Incidents</h2>
                        <div className="space-y-4">
                            {data.activeIncidents.map((incident: any) => (
                                <div key={incident._id} className="border border-red-500/20 bg-red-500/5 rounded-[28px] p-8">
                                    <div className="flex items-center gap-3 mb-4">
                                        <AlertCircle className="w-6 h-6 text-red-500" />
                                        <h3 className="text-xl font-black text-white">
                                            {(incident.apiId?.name || incident.heartbeatId?.name)} Outage
                                        </h3>
                                    </div>
                                    <p className="text-gray-400 mb-6 font-medium leading-relaxed">{incident.reason || 'Service is currently heartbeat-overdue or unreachable.'}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-bold uppercase tracking-widest">
                                        <Clock className="w-4 h-4" />
                                        Started {format(new Date(incident.startTime), 'MMM d, h:mm aa')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── Footer ───────────────────────────────────────────────── */}
                <footer className="mt-28 py-12 border-t border-white/[0.05] flex flex-col items-center">
                    <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Powered by</p>
                    <Link href="/" className="flex items-center gap-3 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Shield className="text-white w-5 h-5" />
                        </div>
                        <span className="text-lg font-black text-white tracking-tighter">Ping<span className="text-blue-500">Forge</span></span>
                    </Link>
                </footer>
            </div>
        </div>
    );
}
