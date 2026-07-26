'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TcpMonitorCard from '@/components/dashboard/TcpMonitorCard';
import api from '@/services/api';
import { Plus, Search, X, Server, Bell, Hash, BellDot } from 'lucide-react';
import AlertChannelSelector from '@/components/alerts/AlertChannelSelector';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useAuth } from '@/context/AuthContext';

const INPUT = 'w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.09] text-white text-sm outline-none transition-all duration-200 placeholder-white/20 focus:bg-white/[0.06] focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/15';
const LABEL = 'block text-[10px] font-black uppercase tracking-[0.12em] text-gray-400 mb-1.5 ml-0.5';

const EMPTY_FORM = { name: '', host: '', port: '', checkInterval: 5, timeout: 10000, alertEmail: '', alertChannels: [] as string[] };

const QUICK_PORTS = [
    { name: 'HTTP', port: 80 },
    { name: 'HTTPS', port: 443 },
    { name: 'MySQL', port: 3306 },
    { name: 'PostgreSQL', port: 5432 },
    { name: 'MongoDB', port: 27017 },
    { name: 'Redis', port: 6379 },
    { name: 'SSH', port: 22 },
];

export default function TcpPage() {
    const router = useRouter();
    const [monitors, setMonitors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState('');
    const { showToast } = useToast();
    const { confirm: askConfirm } = useConfirm();
    const { isAtLeast } = useAuth();

    const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 25, stiffness: 100 } } };

    const fetchMonitors = async () => {
        try {
            const { data } = await api.get('/tcp');
            setMonitors(data);
        } catch (err) {
            console.error('Failed to fetch TCP monitors', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMonitors(); }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { data } = await api.post('/tcp', form);
            setMonitors(prev => [data, ...prev]);
            setIsAdding(false);
            setForm(EMPTY_FORM);
            showToast('TCP monitor added', 'success');
            setTimeout(() => fetchMonitors(), 4500);
        } catch (err: any) {
            console.error('Failed to add TCP monitor', err);
            showToast(err?.response?.data?.message || 'Failed to add TCP monitor', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleTogglePause = async (id: string, isActive: boolean) => {
        try {
            const { data } = await api.patch(`/tcp/${id}/toggle`);
            setMonitors(prev => prev.map(m => m._id === id ? data : m));
            showToast(isActive ? 'Monitor paused' : 'Monitor resumed', 'success');
        } catch (err) {
            showToast('Failed to toggle monitor', 'error');
        }
    };

    const handleDelete = (id: string, name: string) => {
        askConfirm({
            title: 'Delete TCP Monitor',
            message: `Are you sure you want to delete "${name}"? All monitoring history will be lost.`,
            confirmText: 'Delete',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/tcp/${id}`);
                    setMonitors(prev => prev.filter(m => m._id !== id));
                    showToast('Monitor deleted successfully', 'success');
                } catch (err) {
                    showToast('Failed to delete monitor', 'error');
                }
            },
        });
    };

    const handleClose = () => { setIsAdding(false); setForm(EMPTY_FORM); };

    const filtered = monitors.filter(m =>
        m.host.toLowerCase().includes(search.toLowerCase()) ||
        m.name.toLowerCase().includes(search.toLowerCase())
    );

    const up = monitors.filter(m => m.status === 'up').length;
    const down = monitors.filter(m => m.status === 'down').length;
    const pending = monitors.filter(m => m.status === 'pending').length;

    return (
        <motion.div initial="hidden" animate="show" variants={containerVariants} className="p-10">
            <motion.header variants={itemVariants} className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
                        TCP <span className="text-orange-400">Ports</span>
                    </h2>
                    <p className="text-gray-500 font-medium">
                        Monitoring <span className="text-white font-bold">{monitors.length}</span> TCP ports
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div id="tour-tcp-search" className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 group-focus-within:text-orange-400 transition-colors" />
                        <input type="text" placeholder="Find port..." value={search} onChange={e => setSearch(e.target.value)}
                            className="premium-input pl-12 pr-4 py-2.5 w-72" suppressHydrationWarning />
                    </div>
                    {isAtLeast('admin') && (
                        <button id="tour-add-tcp" onClick={() => setIsAdding(true)} suppressHydrationWarning
                            className="premium-button flex items-center gap-2 text-white"
                            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
                            <Plus className="w-5 h-5" /> Add TCP Monitor
                        </button>
                    )}
                </div>
            </motion.header>

            {monitors.length > 0 && (
                <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4 mb-10">
                    {[
                        { label: 'Up', value: up, color: 'text-emerald-400', bg: 'bg-emerald-500/8', border: 'border-emerald-500/15' },
                        { label: 'Down', value: down, color: 'text-red-400', bg: 'bg-red-500/8', border: 'border-red-500/15' },
                        { label: 'Pending', value: pending, color: 'text-gray-400', bg: 'bg-gray-500/8', border: 'border-gray-500/15' },
                    ].map(stat => (
                        <div key={stat.label} className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border ${stat.bg} ${stat.border}`}>
                            <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</span>
                        </div>
                    ))}
                </motion.div>
            )}

            <div id="tour-tcp-grid" className="min-h-[100px]">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="glass-card p-6 border border-white/[0.05] h-64 animate-pulse" />
                            ))}
                        </motion.div>
                    ) : filtered.length > 0 ? (
                        <motion.div key="grid" variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filtered.map(m => (
                                <motion.div key={m._id} variants={itemVariants} initial="hidden" animate="show" exit={{ opacity: 0, scale: 0.9 }}>
                                    <TcpMonitorCard
                                        monitor={m}
                                        onClick={() => router.push(`/dashboard/tcp/${m._id}`)}
                                        onTogglePause={(e) => { e.stopPropagation(); handleTogglePause(m._id, m.isActive); }}
                                        onDelete={(e) => { e.stopPropagation(); handleDelete(m._id, m.name); }}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div key="empty" variants={itemVariants} initial="hidden" animate="show" exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-white/5 rounded-[32px] bg-white/[0.01]">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 border"
                                style={{ background: 'rgba(249,115,22,0.1)', borderColor: 'rgba(249,115,22,0.2)' }}>
                                <Server className="w-10 h-10 text-orange-500 animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">No TCP Monitors</h3>
                            <p className="text-gray-500 mb-8 font-medium text-center max-w-xs">
                                Add a host and port to start checking network connectivity.
                            </p>
                            <button onClick={() => setIsAdding(true)} suppressHydrationWarning
                                className="premium-button flex items-center gap-3 px-8 text-lg"
                                style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
                                <Plus className="w-6 h-6 outline-none" /> Add Your First TCP Monitor
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
                        style={{ backgroundColor: 'rgba(3,3,3,0.88)', backdropFilter: 'blur(12px)' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="w-full max-w-lg relative overflow-hidden flex flex-col shadow-2xl"
                            style={{
                                background: '#0c0c0e',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '28px',
                                boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(249,115,22,0.15)',
                            }}>

                            <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
                                style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }} />

                            <div className="relative z-10 flex items-center gap-4 px-7 pt-7 pb-5"
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                                    style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', boxShadow: '0 4px 20px rgba(249,115,22,0.3)' }}>
                                    <Server className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-black text-white tracking-tight">Add TCP Monitor</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">Check if a port is open and responding</p>
                                </div>
                                <button onClick={handleClose}
                                    className="p-2 rounded-xl text-gray-600 hover:text-white transition-all"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleAdd} className="relative z-10">
                                <div className="px-8 pt-6 pb-8 space-y-5">
                                    <div>
                                        <label className={LABEL}>Friendly Name</label>
                                        <input type="text" required placeholder="e.g. Production Database"
                                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                            className={INPUT} />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-2">
                                            <label className={LABEL}>Host / IP</label>
                                            <div className="relative">
                                                <Server className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                                <input type="text" required placeholder="db.example.com"
                                                    value={form.host} onChange={e => setForm({ ...form, host: e.target.value })}
                                                    className={INPUT + ' font-mono'} style={{ paddingLeft: '2.5rem' }} />
                                            </div>
                                        </div>
                                        <div className="col-span-1">
                                            <label className={LABEL}>Port</label>
                                            <div className="relative">
                                                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                                <input type="number" required placeholder="3306" min="1" max="65535"
                                                    value={form.port} onChange={e => setForm({ ...form, port: e.target.value })}
                                                    className={INPUT + ' font-mono'} style={{ paddingLeft: '2.5rem' }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {QUICK_PORTS.map(qp => (
                                                <button
                                                    key={qp.name}
                                                    type="button"
                                                    onClick={() => { setForm({ ...form, port: String(qp.port), name: form.name || `${qp.name} Server` }) }}
                                                    className="px-2.5 py-1 text-xs font-bold font-mono text-gray-400 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                                                >
                                                    {qp.name} ({qp.port})
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={LABEL}>Check Interval</label>
                                            <select
                                                value={form.checkInterval}
                                                onChange={e => setForm({ ...form, checkInterval: parseInt(e.target.value) })}
                                                className={INPUT}
                                            >
                                                <option value={1} className="bg-[#0c0c0e] text-white">Every 1 minute</option>
                                                <option value={5} className="bg-[#0c0c0e] text-white">Every 5 minutes</option>
                                                <option value={15} className="bg-[#0c0c0e] text-white">Every 15 minutes</option>
                                                <option value={30} className="bg-[#0c0c0e] text-white">Every 30 minutes</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={LABEL}>Timeout (ms)</label>
                                            <input type="number" required min="1000" max="30000" step="1000"
                                                value={form.timeout} onChange={e => setForm({ ...form, timeout: parseInt(e.target.value) })}
                                                className={INPUT} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={LABEL}>Alert Email</label>
                                        <div className="relative mb-5">
                                            <Bell className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                            <input type="email" placeholder="alerts@company.com"
                                                value={form.alertEmail} onChange={e => setForm({ ...form, alertEmail: e.target.value })}
                                                className={INPUT} style={{ paddingLeft: '2.5rem' }} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={LABEL}>Notification Channels</label>
                                        <AlertChannelSelector 
                                            selectedChannels={form.alertChannels}
                                            onChange={(ids) => setForm({ ...form, alertChannels: ids })}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 px-8 pb-7" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
                                    <button type="button" onClick={handleClose}
                                        className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-400 hover:text-white transition-all"
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={submitting}
                                        className="flex-1 py-3 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all cursor-pointer"
                                        style={{ background: submitting ? 'rgba(249,115,22,0.5)' : 'linear-gradient(135deg, #f97316, #ea580c)', boxShadow: '0 4px 20px rgba(249,115,22,0.25)' }}>
                                        {submitting ? 'Adding...' : '⚡ Start Monitoring'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
