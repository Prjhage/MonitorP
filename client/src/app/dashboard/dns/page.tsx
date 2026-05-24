'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DnsMonitorCard from '@/components/dashboard/DnsMonitorCard';
import api from '@/services/api';
import { Plus, Search, X, Globe, Bell, Server, BellDot } from 'lucide-react';
import AlertChannelSelector from '@/components/alerts/AlertChannelSelector';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useAuth } from '@/context/AuthContext';

const INPUT = 'w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.09] text-white text-sm outline-none transition-all duration-200 placeholder-white/20 focus:bg-white/[0.06] focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/15';
const LABEL = 'block text-[10px] font-black uppercase tracking-[0.12em] text-gray-400 mb-1.5 ml-0.5';

const EMPTY_FORM = { name: '', domain: '', recordTypes: ['A', 'MX', 'CNAME'], checkInterval: 15, alertEmail: '', alertChannels: [] as string[] };
const ALL_RECORDS = ['A', 'AAAA', 'MX', 'CNAME', 'TXT', 'NS'];

export default function DnsPage() {
    const router = useRouter();
    const [monitors, setMonitors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [form, setForm] = useState<{name: string; domain: string; recordTypes: string[]; checkInterval: number; alertEmail: string; alertChannels: string[]}>(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState('');
    const { showToast } = useToast();
    const { confirm: askConfirm } = useConfirm();
    const { isAtLeast } = useAuth();

    const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 25, stiffness: 100 } } };

    const fetchMonitors = async () => {
        try {
            const { data } = await api.get('/dns');
            setMonitors(data);
        } catch (err) {
            console.error('Failed to fetch DNS monitors', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMonitors(); }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.recordTypes.length === 0) {
             showToast('Please select at least one DNS record type.', 'error');
             return;
        }

        setSubmitting(true);
        try {
            const { data } = await api.post('/dns', form);
            setMonitors(prev => [data, ...prev]);
            setIsAdding(false);
            setForm(EMPTY_FORM);
            showToast('DNS monitor added', 'success');
            setTimeout(() => fetchMonitors(), 4500);
        } catch (err: any) {
            console.error('Failed to add DNS monitor', err);
            showToast(err?.response?.data?.message || 'Failed to add DNS monitor', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleTogglePause = async (id: string, isActive: boolean) => {
        try {
            const { data } = await api.patch(`/dns/${id}/toggle`);
            setMonitors(prev => prev.map(m => m._id === id ? data : m));
            showToast(isActive ? 'Monitor paused' : 'Monitor resumed', 'success');
        } catch (err) {
            showToast('Failed to toggle monitor', 'error');
        }
    };

    const handleDelete = (id: string, name: string) => {
        askConfirm({
            title: 'Delete DNS Monitor',
            message: `Are you sure you want to delete "${name}"? All monitoring history will be lost.`,
            confirmText: 'Delete',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/dns/${id}`);
                    setMonitors(prev => prev.filter(m => m._id !== id));
                    showToast('Monitor deleted successfully', 'success');
                } catch (err) {
                    showToast('Failed to delete monitor', 'error');
                }
            },
        });
    };

    const handleClose = () => { setIsAdding(false); setForm(EMPTY_FORM); };

    const toggleRecordType = (type: string) => {
        setForm(prev => {
             const types = [...prev.recordTypes];
             if (types.includes(type)) {
                  return { ...prev, recordTypes: types.filter(t => t !== type) };
             } else {
                  return { ...prev, recordTypes: [...types, type] };
             }
        });
    }

    const filtered = monitors.filter(m =>
        m.domain.toLowerCase().includes(search.toLowerCase()) ||
        m.name.toLowerCase().includes(search.toLowerCase())
    );

    const ok = monitors.filter(m => m.status === 'ok').length;
    const changed = monitors.filter(m => m.status === 'changed').length;
    const failed = monitors.filter(m => m.status === 'failed' || m.status === 'pending').length;

    return (
        <motion.div initial="hidden" animate="show" variants={containerVariants} className="p-10">
            <motion.header variants={itemVariants} className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
                        DNS <span className="text-purple-400">Records</span>
                    </h2>
                    <p className="text-gray-500 font-medium">
                        Monitoring <span className="text-white font-bold">{monitors.length}</span> DNS configurations
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div id="tour-dns-search" className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 group-focus-within:text-purple-400 transition-colors" />
                        <input type="text" placeholder="Find domain..." value={search} onChange={e => setSearch(e.target.value)}
                            className="premium-input pl-12 pr-4 py-2.5 w-72" suppressHydrationWarning />
                    </div>
                    {isAtLeast('admin') && (
                        <button id="tour-add-dns" onClick={() => setIsAdding(true)} suppressHydrationWarning
                            className="premium-button flex items-center gap-2 text-white"
                            style={{ background: 'linear-gradient(135deg, #9333ea, #a855f7)' }}>
                            <Plus className="w-5 h-5" /> Add DNS Monitor
                        </button>
                    )}
                </div>
            </motion.header>

            {monitors.length > 0 && (
                <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4 mb-10">
                    {[
                        { label: 'OK', value: ok, color: 'text-emerald-400', bg: 'bg-emerald-500/8', border: 'border-emerald-500/15' },
                        { label: 'Changed', value: changed, color: 'text-amber-400', bg: 'bg-amber-500/8', border: 'border-amber-500/15' },
                        { label: 'Failed/Pending', value: failed, color: 'text-gray-400', bg: 'bg-gray-500/8', border: 'border-gray-500/15' },
                    ].map(stat => (
                        <div key={stat.label} className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border ${stat.bg} ${stat.border}`}>
                            <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</span>
                        </div>
                    ))}
                </motion.div>
            )}

            <div id="tour-dns-grid" className="min-h-[100px]">
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
                                    <DnsMonitorCard
                                        monitor={m}
                                        onClick={() => router.push(`/dashboard/dns/${m._id}`)}
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
                                style={{ background: 'rgba(147,51,234,0.1)', borderColor: 'rgba(147,51,234,0.2)' }}>
                                <Globe className="w-10 h-10 text-purple-500 animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">No DNS Monitors</h3>
                            <p className="text-gray-500 mb-8 font-medium text-center max-w-xs">
                                Add a domain to start tracking DNS record changes.
                            </p>
                            <button onClick={() => setIsAdding(true)} suppressHydrationWarning
                                className="premium-button flex items-center gap-3 px-8 text-lg"
                                style={{ background: 'linear-gradient(135deg, #9333ea, #a855f7)' }}>
                                <Plus className="w-6 h-6 outline-none" /> Add Your First DNS Monitor
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
                                boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(147,51,234,0.15)',
                            }}>

                            <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
                                style={{ background: 'radial-gradient(circle, rgba(147,51,234,0.08) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }} />

                            <div className="relative z-10 flex items-center gap-4 px-7 pt-7 pb-5"
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                                    style={{ background: 'linear-gradient(135deg, #9333ea, #a855f7)', boxShadow: '0 4px 20px rgba(147,51,234,0.3)' }}>
                                    <Globe className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-black text-white tracking-tight">Add DNS Monitor</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">Detect changes in your DNS records</p>
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
                                        <input type="text" required placeholder="e.g. Main Domain DNS"
                                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                            className={INPUT} />
                                    </div>

                                    <div>
                                        <label className={LABEL}>Domain</label>
                                        <div className="relative">
                                            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                            <input type="text" required placeholder="example.com"
                                                value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })}
                                                className={INPUT + ' font-mono'} style={{ paddingLeft: '2.5rem' }} />
                                        </div>
                                    </div>

                                    <div>
                                         <label className={LABEL}>Record Types</label>
                                         <div className="flex flex-wrap gap-2">
                                              {ALL_RECORDS.map(type => (
                                                  <button
                                                      key={type}
                                                      type="button"
                                                      onClick={() => toggleRecordType(type)}
                                                      className={`px-3 py-1.5 rounded-lg text-sm font-bold font-mono transition-colors ${
                                                          form.recordTypes.includes(type)
                                                          ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                                                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                      }`}
                                                  >
                                                      {type}
                                                  </button>
                                              ))}
                                         </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className={LABEL}>Check Interval</label>
                                            <select
                                                value={form.checkInterval}
                                                onChange={e => setForm({ ...form, checkInterval: parseInt(e.target.value) })}
                                                className={INPUT}
                                            >
                                                <option value={5}>Every 5 minutes</option>
                                                <option value={15}>Every 15 minutes</option>
                                                <option value={30}>Every 30 minutes</option>
                                                <option value={60}>Every 1 hour</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
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
                                        style={{ background: submitting ? 'rgba(147,51,234,0.5)' : 'linear-gradient(135deg, #9333ea, #a855f7)', boxShadow: '0 4px 20px rgba(147,51,234,0.25)' }}>
                                        {submitting ? 'Adding...' : '⚡ Add Monitor'}
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
