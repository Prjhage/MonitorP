'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Shield, Activity, Heart, AlertCircle, CheckCircle2, Lock, TrendingUp, ArrowRight, Eye, ShieldCheck } from 'lucide-react';
import { DEMO_MONITORS, DEMO_INCIDENTS, DEMO_HEARTBEATS, DEMO_SSL } from '@/data/demoData';
import DemoAPICard from '@/components/demo/DemoAPICard';
import ConversionCTA from '@/components/demo/ConversionCTA';

type TabId = 'monitors' | 'heartbeats' | 'incidents' | 'ssl';

function StatCard({ label, value, color, glow }: { label: string; value: string | number; color: string; glow: string }) {
    return (
        <div className={`relative bg-white/[0.02] border border-white/[0.05] rounded-[20px] p-5 overflow-hidden group hover:border-white/10 transition-all`}>
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${glow}`} />
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.15em] mb-2">{label}</p>
            <p className={`text-3xl font-black ${color}`}>{value}</p>
        </div>
    );
}

export default function DemoPage() {
    const [monitors, setMonitors] = useState(DEMO_MONITORS);
    const [activeTab, setActiveTab] = useState<TabId>('monitors');
    const [showCTA, setShowCTA] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowCTA(true), 30000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setMonitors(prev => prev.map(monitor => ({
                ...monitor,
                responseTime: monitor.responseTime !== null
                    ? Math.max(50, monitor.responseTime + Math.floor(Math.random() * 40 - 20))
                    : null,
                lastChecked: 'just now',
            })) as typeof DEMO_MONITORS);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const upCount = monitors.filter(m => m.status === 'UP').length;
    const downCount = monitors.filter(m => m.status === 'DOWN').length;
    const degradedCount = monitors.filter(m => m.status === 'DEGRADED').length;
    const healthPct = Math.round((upCount / monitors.length) * 100);

    const tabs: { id: TabId; label: string; icon: React.ElementType; count: number }[] = [
        { id: 'monitors',   label: 'API Monitors',  icon: Activity, count: monitors.length },
        { id: 'heartbeats', label: 'Heartbeats',    icon: Heart,    count: DEMO_HEARTBEATS.length },
        { id: 'incidents',  label: 'Incidents',     icon: AlertCircle, count: DEMO_INCIDENTS.filter(i => i.status === 'OPEN').length },
        { id: 'ssl',        label: 'SSL',           icon: ShieldCheck, count: DEMO_SSL.length },
    ];

    return (
        <div className="min-h-screen bg-[#050508]">
            {/* Grid background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.04)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative max-w-7xl mx-auto px-6 py-10">
                {/* ─── Top Navbar ──────────────────────────────────────── */}
                <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/[0.05]">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-0 group-hover:opacity-40 transition-opacity rounded-xl" />
                            <div className="relative w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center border border-white/20 shadow-lg shadow-blue-500/20">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <span className="text-xl font-black tracking-tighter text-white group-hover:text-blue-400 transition-colors">
                            PingForge
                        </span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-sm text-gray-500 hover:text-white font-bold transition-colors">Home</Link>
                        <Link href="/docs" className="text-sm text-gray-500 hover:text-white font-bold transition-colors">Docs</Link>
                        <Link href="/register" className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all">
                            Start For Free <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

                {/* ─── Workspace Header ────────────────────────────────── */}
                <div className="flex items-start justify-between mb-10">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">TechCorp Solutions</h1>
                        <p className="text-xs text-gray-600 font-bold uppercase tracking-widest mt-1">Demo Workspace • Live updates every 5s</p>
                    </div>
                </div>

                {/* ─── Stats ──────────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <StatCard label="Overall Health" value={`${healthPct}%`} color="text-white" glow="bg-blue-500/5" />
                    <StatCard label="Operational" value={upCount} color="text-emerald-400" glow="bg-emerald-500/5" />
                    <StatCard label="Down" value={downCount} color="text-red-400" glow="bg-red-500/5" />
                    <StatCard label="Degraded" value={degradedCount} color="text-amber-400" glow="bg-amber-500/5" />
                </div>

                {/* ─── Tabs ───────────────────────────────────────────── */}
                <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                activeTab === tab.id
                                    ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/5 text-white border border-blue-500/30'
                                    : 'bg-white/[0.02] border border-white/[0.05] text-gray-500 hover:text-white hover:border-white/10'
                            }`}>
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                                    activeTab === tab.id ? 'bg-blue-500/20 text-blue-400' : 'bg-white/[0.04] text-gray-600'
                                }`}>{tab.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ─── Tab Content ─────────────────────────────────────── */}
                <AnimatePresence mode="wait">
                    {activeTab === 'monitors' && (
                        <motion.div key="monitors" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                            {monitors.map(monitor => <DemoAPICard key={monitor.id} monitor={monitor} />)}
                        </motion.div>
                    )}

                    {activeTab === 'heartbeats' && (
                        <motion.div key="heartbeats" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                            {DEMO_HEARTBEATS.map(hb => (
                                <div key={hb.id} className={`bg-white/[0.02] border rounded-[20px] p-5 flex items-center justify-between ${hb.status === 'DOWN' ? 'border-red-500/20' : 'border-white/[0.05]'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className={`w-3 h-3 rounded-full ${hb.status === 'UP' ? 'bg-emerald-400 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-black">{hb.name}</h3>
                                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Expected every {hb.expectedEvery}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-black text-sm ${hb.status === 'DOWN' ? 'text-red-400' : 'text-gray-300'}`}>{hb.nextExpected}</p>
                                        <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">Last ping {hb.lastPing}</p>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {activeTab === 'incidents' && (
                        <motion.div key="incidents" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                            {DEMO_INCIDENTS.map(inc => (
                                <div key={inc.id} className={`border rounded-[20px] p-6 ${inc.status === 'OPEN' ? 'border-red-500/20 bg-red-500/5' : 'bg-white/[0.02] border-white/[0.05]'}`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            {inc.status === 'OPEN'
                                                ? <AlertCircle className="w-5 h-5 text-red-500" />
                                                : <CheckCircle2 className="w-5 h-5 text-gray-500" />}
                                            <h3 className="text-white font-black">{inc.apiName} Outage</h3>
                                        </div>
                                        <span className={`px-3 py-1 rounded-xl text-xs font-black border ${inc.status === 'OPEN' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white/[0.04] text-gray-500 border-white/[0.05]'}`}>
                                            {inc.status}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-sm leading-relaxed mb-3">{inc.reason}</p>
                                    <div className="flex items-center gap-6 text-xs text-gray-600 font-bold uppercase tracking-widest">
                                        <span>Started {inc.startedAt}</span>
                                        <span>Duration {inc.duration}</span>
                                        {inc.resolvedAt && <span>Resolved {inc.resolvedAt}</span>}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {activeTab === 'ssl' && (
                        <motion.div key="ssl" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="bg-white/[0.02] border border-white/[0.05] rounded-[24px] overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-white/[0.02] border-b border-white/[0.05]">
                                        <tr>
                                            {['Monitor', 'Domain', 'Days Left', 'Status'].map(h => (
                                                <th key={h} className="px-6 py-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.03]">
                                        {DEMO_SSL.map(ssl => (
                                            <tr key={ssl.id} className="hover:bg-white/[0.01] transition-colors">
                                                <td className="px-6 py-5 text-white font-black">{ssl.name}</td>
                                                <td className="px-6 py-5 text-gray-400 font-mono text-sm">{ssl.domain}</td>
                                                <td className="px-6 py-5">
                                                    <span className={`font-black text-sm ${ssl.daysRemaining < 7 ? 'text-red-400' : ssl.daysRemaining < 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                        {ssl.daysRemaining}d
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`px-3 py-1 rounded-xl text-xs font-black border ${ssl.status === 'VALID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                                        {ssl.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ─── CTA Section ────────────────────────────────────── */}
                <div className="mt-16 p-[1px] rounded-[32px] bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-transparent">
                    <div className="bg-white/[0.02] rounded-[31px] p-10 text-center">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-3">You've seen the demo</p>
                        <h2 className="text-3xl font-black text-white tracking-tight mb-3">Ready to monitor your real APIs?</h2>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">Set up monitoring in under 5 minutes. No credit card. No BS.</p>
                        <div className="flex items-center justify-center gap-4">
                            <Link href="/register" className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95 transition-all">
                                Get Started Free <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link href="/docs" className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-gray-300 font-black text-sm uppercase tracking-widest hover:bg-white/[0.05] hover:text-white transition-all">
                                Read Docs <Eye className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating CTA */}
            <AnimatePresence>
                {showCTA && <ConversionCTA onClose={() => setShowCTA(false)} />}
            </AnimatePresence>
        </div>
    );
}
