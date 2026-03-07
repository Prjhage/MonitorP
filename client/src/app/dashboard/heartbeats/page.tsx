'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCache } from '@/context/CacheContext';
import HeartbeatCard from '@/components/dashboard/HeartbeatCard';
import {
    Plus, Bell, Search, Heart, X, Zap, Clock, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/context/ToastContext';

const INPUT = 'w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.09] text-white text-sm outline-none transition-all duration-200 placeholder-white/20 focus:bg-white/[0.06] focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/15';
const SELECT = 'w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.09] text-white text-sm outline-none transition-all duration-200 focus:bg-white/[0.06] focus:border-pink-500/60 appearance-none pr-9 cursor-pointer';
const LABEL = 'block text-[10px] font-black uppercase tracking-[0.12em] text-gray-400 mb-1.5 ml-0.5';

const SELECT_ARROW = {
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
    backgroundPosition: 'right 0.6rem center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '1.2em 1.2em',
};

export default function HeartbeatsPage() {
    const { heartbeats, loading, addHeartbeat } = useCache();
    const router = useRouter();
    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [createdHb, setCreatedHb] = useState<any>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const { showToast } = useToast(); // Added useToast hook

    const handleCopy = async (text: string, id: string) => {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
            } else {
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

    const [form, setForm] = useState({
        name: '',
        scheduleType: 'interval',
        cronExpression: '',
        timezone: 'UTC',
        expectedEvery: 24,
        expectedEveryUnit: 'hours',
        gracePeriod: 30,
        maxDuration: 30,
        maxDurationUnit: 'minutes',
        alertEmail: ''
    });

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = await addHeartbeat(form);
            setCreatedHb(data);
        } catch (err) {
            console.error('Failed to add Heartbeat', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setIsAdding(false);
        setCreatedHb(null);
        setForm({
            name: '',
            scheduleType: 'interval',
            cronExpression: '',
            timezone: 'UTC',
            expectedEvery: 24,
            expectedEveryUnit: 'hours',
            gracePeriod: 30,
            maxDuration: 30,
            maxDurationUnit: 'minutes',
            alertEmail: ''
        });
    };

    const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

    const signals = createdHb ? [
        { label: 'Job Started', url: `${backendBase}/ping/${createdHb.slug}/start`, color: 'blue', desc: 'Call at beginning of job' },
        { label: 'Job Succeeded', url: `${backendBase}/ping/${createdHb.slug}`, color: 'emerald', desc: 'Call when job finishes successfully' },
        { label: 'Job Failed', url: `${backendBase}/ping/${createdHb.slug}/fail`, color: 'rose', desc: 'Call on catch/error block' },
    ] : [];


    return (
        <motion.div initial="hidden" animate="show" variants={containerVariants} className="p-10">
            <motion.header variants={itemVariants} className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
                        Heartbeat <span className="text-pink-500">Monitors</span>
                    </h2>
                    <p className="text-gray-500 font-medium">
                        Listening for <span className="text-white font-bold">{heartbeats.length}</span> active heartbeats
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 group-focus-within:text-pink-400 transition-colors" />
                        <input type="text" placeholder="Find heartbeat..." className="premium-input pl-12 pr-4 py-2.5 w-72" suppressHydrationWarning />
                    </div>
                    <button id="tour-add-hb" onClick={() => setIsAdding(true)} suppressHydrationWarning className="premium-button flex items-center gap-2 bg-gradient-to-r from-pink-600 to-rose-600">
                        <Plus className="w-5 h-5" /> Add Heartbeat
                    </button>
                </div>
            </motion.header>

            <motion.div id="tour-hb-list" variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                    {heartbeats.map((hb) => (
                        <motion.div key={hb._id} variants={itemVariants} layout initial="hidden" animate="show"
                            exit={{ opacity: 0, scale: 0.9 }}>
                            <HeartbeatCard heartbeat={hb} onClick={() => router.push(`/dashboard/heartbeats/${hb._id}`)} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {!loading && heartbeats.length === 0 && (
                <motion.div variants={itemVariants} className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-[32px] bg-white/[0.01]">
                    <div className="w-20 h-20 bg-pink-600/10 rounded-full flex items-center justify-center mb-6 border border-pink-500/20">
                        <Heart className="w-10 h-10 text-pink-500 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2 tracking-tight">No Heartbeats Configured</h3>
                    <p className="text-gray-500 mb-8 font-medium">Create a heartbeat monitor for your cron jobs or background tasks.</p>
                    <button onClick={() => setIsAdding(true)} suppressHydrationWarning className="premium-button flex items-center gap-3 px-8 text-lg bg-pink-600">
                        <Plus className="w-6 h-6" /> Add Your First Heartbeat
                    </button>
                </motion.div>
            )}

            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: 'rgba(3,3,3,0.88)', backdropFilter: 'blur(12px)' }}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-2xl relative overflow-hidden flex flex-col glass-card border-white/10 shadow-2xl rounded-[32px]">

                            <div className="relative z-10 flex items-center gap-4 px-8 pt-8 pb-6 border-b border-white/5">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg shadow-pink-500/20">
                                    <Heart className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-black text-white tracking-tight">New Heartbeat</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">Passive monitoring for background tasks</p>
                                </div>
                                <button onClick={handleClose} className="p-2 rounded-xl bg-white/5 text-gray-500 hover:text-white transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="px-8 pt-6 pb-12 overflow-y-auto max-h-[75vh] custom-scrollbar">
                                {createdHb ? (
                                    <div className="space-y-6">
                                        <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center text-center">
                                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                                                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                                            </div>
                                            <h4 className="text-lg font-black text-white mb-2">Signal System Activated!</h4>
                                            <p className="text-sm text-emerald-400/80">MonitorX now supports a 3-tier signal system for total control.</p>
                                        </div>

                                        <div className="space-y-4">
                                            {signals.map((sig, i) => (
                                                <div key={i} className="space-y-2">
                                                    <div className="flex justify-between items-center px-1">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest bg-${sig.color}-500/10 text-${sig.color}-400 px-2.5 py-1 rounded-md border border-${sig.color}-500/20`}>{sig.label}</span>
                                                        <span className="text-[10px] text-gray-500 font-medium italic">{sig.desc}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleCopy(`curl.exe "${sig.url}"`, `url-${i}`)}
                                                        className="w-full flex items-center gap-3 p-3 bg-black/40 border border-white/5 rounded-[18px] group/url hover:border-white/20 hover:bg-white/[0.02] transition-all"
                                                        title="Click to copy cURL command"
                                                    >
                                                        <code className="text-[11px] text-pink-400 font-mono flex-1 text-left break-all truncate">
                                                            curl.exe "{sig.url}"
                                                        </code>
                                                        <div
                                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${copiedId === `url-${i}`
                                                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                                : 'bg-white/5 group-hover/url:bg-white/10 text-white border border-white/10'
                                                                }`}
                                                        >
                                                            {copiedId === `url-${i}` ? '✓' : 'Copy'}
                                                        </div>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Example (cURL)</p>
                                                <button
                                                    onClick={() => handleCopy(`curl.exe "${backendBase}/ping/${createdHb.slug}"`, 'curl-example')}
                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${copiedId === 'curl-example'
                                                        ? 'bg-emerald-500/20 text-emerald-400'
                                                        : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                                                        }`}
                                                >
                                                    {copiedId === 'curl-example' ? '✓ Copied' : 'Copy'}
                                                </button>
                                            </div>
                                            <code className="text-[10px] text-gray-400 block bg-black/20 p-3 rounded-lg break-all whitespace-pre-wrap">
                                                curl.exe "{backendBase}/ping/{createdHb.slug}"
                                            </code>
                                        </div>

                                        <button onClick={handleClose} className="w-full premium-button py-3 mt-4 text-white btn-glow-pink">
                                            Go to Dashboard
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleAdd} className="space-y-6">
                                        <div id="tour-hb-form-name">
                                            <label className={LABEL}>Friendly Name</label>
                                            <div className="relative">
                                                <Heart className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <input type="text" required placeholder="e.g. Nightly DB Backup" value={form.name}
                                                    onChange={e => setForm({ ...form, name: e.target.value })} className={INPUT} style={{ paddingLeft: '3rem' }} suppressHydrationWarning />
                                            </div>
                                        </div>

                                        {/* Schedule Type Selection */}
                                        <div id="tour-hb-form-type" className="flex gap-2 p-1.5 bg-white/[0.03] border border-white/[0.05] rounded-[18px]">
                                            {['interval', 'cron'].map(type => (
                                                <button key={type} type="button" onClick={() => setForm({ ...form, scheduleType: type as any })}
                                                    className={`flex-1 py-2.5 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all ${form.scheduleType === type ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                                                    {type}
                                                </button>
                                            ))}
                                        </div>

                                        {form.scheduleType === 'interval' ? (
                                            <div id="tour-hb-interval" className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className={LABEL}>Expected Every</label>
                                                    <div className="relative">
                                                        <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                        <input type="number" required value={form.expectedEvery}
                                                            onChange={e => setForm({ ...form, expectedEvery: e.target.value === '' ? '' : parseInt(e.target.value) } as any)} className={INPUT} style={{ paddingLeft: '3rem' }} suppressHydrationWarning />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className={LABEL}>Time Unit</label>
                                                    <select value={form.expectedEveryUnit} onChange={e => setForm({ ...form, expectedEveryUnit: e.target.value })}
                                                        className={SELECT} style={SELECT_ARROW}>
                                                        <option value="minutes" className="bg-[#0a0a0a]">Minutes</option>
                                                        <option value="hours" className="bg-[#0a0a0a]">Hours</option>
                                                        <option value="days" className="bg-[#0a0a0a]">Days</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div id="tour-hb-cron-expr" className="col-span-1">
                                                    <label className={LABEL}>Cron Expression</label>
                                                    <input type="text" placeholder="0 2 * * *" required value={form.cronExpression}
                                                        onChange={e => setForm({ ...form, cronExpression: e.target.value })} className={INPUT} suppressHydrationWarning />
                                                </div>
                                                <div id="tour-hb-timezone" className="col-span-1">
                                                    <label className={LABEL}>Timezone</label>
                                                    <select value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })}
                                                        className={SELECT} style={SELECT_ARROW}>
                                                        <option value="UTC" className="bg-[#0a0a0a]">UTC</option>
                                                        <option value="Asia/Kolkata" className="bg-[#0a0a0a]">Asia/Kolkata (IST)</option>
                                                        <option value="America/New_York" className="bg-[#0a0a0a]">America/New_York</option>
                                                        <option value="Europe/London" className="bg-[#0a0a0a]">Europe/London</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div id="tour-hb-duration">
                                                <label className={LABEL}>Max Allowed Duration</label>
                                                <div className="relative">
                                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                    <input type="number" required value={form.maxDuration}
                                                        onChange={e => setForm({ ...form, maxDuration: e.target.value === '' ? '' : parseInt(e.target.value) } as any)} className={INPUT} style={{ paddingLeft: '3rem' }} suppressHydrationWarning />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={LABEL}>Duration Unit</label>
                                                <select value={form.maxDurationUnit} onChange={e => setForm({ ...form, maxDurationUnit: e.target.value })}
                                                    className={SELECT} style={SELECT_ARROW}>
                                                    <option value="seconds" className="bg-[#0a0a0a]">Seconds</option>
                                                    <option value="minutes" className="bg-[#0a0a0a]">Minutes</option>
                                                    <option value="hours" className="bg-[#0a0a0a]">Hours</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div id="tour-hb-grace">
                                                <label className={LABEL}>Grace Period (m)</label>
                                                <div className="relative">
                                                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                    <input type="number" required value={form.gracePeriod}
                                                        onChange={e => setForm({ ...form, gracePeriod: e.target.value === '' ? '' : parseInt(e.target.value) } as any)} className={INPUT} style={{ paddingLeft: '3rem' }} suppressHydrationWarning />
                                                </div>
                                            </div>
                                            <div id="tour-hb-email">
                                                <label className={LABEL}>Alert Email</label>
                                                <input type="email" placeholder="alerts@company.com" value={form.alertEmail}
                                                    onChange={e => setForm({ ...form, alertEmail: e.target.value })} className={INPUT} suppressHydrationWarning />
                                            </div>
                                        </div>

                                        <button id="tour-hb-form-submit" type="submit" disabled={submitting} className="w-full premium-button py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-lg btn-glow-pink" suppressHydrationWarning>
                                            {submitting ? 'Creating...' : 'Create Heartbeat Monitor'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
