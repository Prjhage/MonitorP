'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DomainExpiryCard from '@/components/dashboard/DomainExpiryCard';
import api from '@/services/api';
import { Plus, Search, X, Calendar, Bell, Globe, BellDot, Pencil } from 'lucide-react';
import AlertChannelSelector from '@/components/alerts/AlertChannelSelector';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useAuth } from '@/context/AuthContext';

const INPUT = 'w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.09] text-white text-sm outline-none transition-all duration-200 placeholder-white/20 focus:bg-white/[0.06] focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/15';
const LABEL = 'block text-[10px] font-black uppercase tracking-[0.12em] text-gray-400 mb-1.5 ml-0.5';

const EMPTY_FORM = { name: '', domain: '', alertEmail: '', alertChannels: [] as string[] };

export default function DomainsPage() {
    const router = useRouter();
    const [monitors, setMonitors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editForm, setEditForm] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editTab, setEditTab] = useState<'basic' | 'notifications'>('basic');
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState('');
    const { showToast } = useToast();
    const { confirm: askConfirm } = useConfirm();
    const { isAtLeast } = useAuth();

    const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 25, stiffness: 100 } } };

    const fetchMonitors = async () => {
        try {
            const { data } = await api.get('/domains');
            setMonitors(data);
        } catch (err) {
            console.error('Failed to fetch domain monitors', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMonitors(); }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { data } = await api.post('/domains', form);
            setMonitors(prev => [...prev, data]);
            setIsAdding(false);
            setForm(EMPTY_FORM);
            showToast('Domain monitor added. Looking up WHOIS data...', 'success');
            setTimeout(() => fetchMonitors(), 4500);
        } catch (err: any) {
            console.error('Failed to add domain monitor', err);
            showToast(err?.response?.data?.message || 'Failed to add domain monitor', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => { setIsAdding(false); setIsEditing(false); setForm(EMPTY_FORM); setEditForm(null); };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { data } = await api.patch(`/domains/${editForm._id}`, editForm);
            setMonitors(prev => prev.map(m => m._id === data._id ? data : m));
            setIsEditing(false);
            setEditForm(null);
            showToast('Domain monitor updated.', 'success');
        } catch (err: any) {
            console.error('Failed to update domain monitor', err);
            showToast(err?.response?.data?.message || 'Failed to update domain monitor', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleTogglePause = async (id: string, isActive: boolean) => {
        try {
            const { data } = await api.patch(`/domains/${id}/toggle`);
            setMonitors(prev => prev.map(m => m._id === id ? data : m));
            showToast(isActive ? 'Monitor paused' : 'Monitor resumed', 'success');
        } catch (err) {
            showToast('Failed to toggle monitor', 'error');
        }
    };

    const handleDelete = (id: string, name: string) => {
        askConfirm({
            title: 'Delete Domain Monitor',
            message: `Are you sure you want to delete "${name}"? All monitoring history will be lost.`,
            confirmText: 'Delete',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/domains/${id}`);
                    setMonitors(prev => prev.filter(m => m._id !== id));
                    showToast('Monitor deleted successfully', 'success');
                } catch (err) {
                    showToast('Failed to delete monitor', 'error');
                }
            },
        });
    };

    const openEdit = (monitor: any) => {
        setEditForm({
            _id: monitor._id,
            name: monitor.name,
            domain: monitor.domain,
            alertEmail: monitor.alertEmail,
            alertChannels: monitor.alertChannels || []
        });
        setEditTab('basic');
        setIsEditing(true);
    };

    const filtered = monitors.filter(m =>
        m.domain.toLowerCase().includes(search.toLowerCase()) ||
        m.name.toLowerCase().includes(search.toLowerCase())
    );

    const safeMonitors = monitors.filter(m => (m.daysRemaining ?? Infinity) > 30).length;
    const expiringSoon = monitors.filter(m => {
        const d = m.daysRemaining;
        return d !== null && d !== undefined && d > 0 && d <= 30;
    }).length;
    const exp_or_alert = monitors.filter(m => m.daysRemaining !== null && m.daysRemaining !== undefined && m.daysRemaining <= 0).length;

    return (
        <motion.div initial="hidden" animate="show" variants={containerVariants} className="p-10">
            <motion.header variants={itemVariants} className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
                        Domain <span className="text-amber-400">Expiry</span>
                    </h2>
                    <p className="text-gray-500 font-medium">
                        Monitoring <span className="text-white font-bold">{monitors.length}</span> domain registrations
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div id="tour-domain-search" className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 group-focus-within:text-amber-400 transition-colors" />
                        <input type="text" placeholder="Find domain..." value={search} onChange={e => setSearch(e.target.value)}
                            className="premium-input pl-12 pr-4 py-2.5 w-72" suppressHydrationWarning />
                    </div>
                    {isAtLeast('admin') && (
                        <button id="tour-add-domain" onClick={() => setIsAdding(true)} suppressHydrationWarning
                            className="premium-button flex items-center gap-2 text-amber-950 font-black"
                            style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
                            <Plus className="w-5 h-5" /> Add Domain Monitor
                        </button>
                    )}
                </div>
            </motion.header>

            {monitors.length > 0 && (
                <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4 mb-10">
                    {[
                        { label: 'Safe (>30 days)', value: safeMonitors, color: 'text-emerald-400', bg: 'bg-emerald-500/8', border: 'border-emerald-500/15' },
                        { label: 'Expiring Soon (≤30)', value: expiringSoon, color: 'text-amber-400', bg: 'bg-amber-500/8', border: 'border-amber-500/15' },
                        { label: 'Expired', value: exp_or_alert, color: 'text-red-400', bg: 'bg-red-500/8', border: 'border-red-500/15' },
                    ].map(stat => (
                        <div key={stat.label} className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border ${stat.bg} ${stat.border}`}>
                            <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</span>
                        </div>
                    ))}
                </motion.div>
            )}

            <div id="tour-domain-grid" className="min-h-[100px]">
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
                                    <DomainExpiryCard 
                                        monitor={m} 
                                        onClick={() => console.log('Domain details WIP', m._id)} 
                                        onEdit={(e) => { e.stopPropagation(); openEdit(m); }}
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
                                style={{ background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.2)' }}>
                                <Calendar className="w-10 h-10 text-amber-500 animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">No Domain Monitors</h3>
                            <p className="text-gray-500 mb-8 font-medium text-center max-w-xs">
                                Add a domain to start tracking its WHOIS expiry date.
                            </p>
                            <button onClick={() => setIsAdding(true)} suppressHydrationWarning
                                className="premium-button flex items-center gap-3 px-8 text-lg text-amber-950 font-black"
                                style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
                                <Plus className="w-6 h-6 outline-none" /> Add Your First Domain Monitor
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
                                boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(245,158,11,0.15)',
                            }}>

                            <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
                                style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }} />

                            <div className="relative z-10 flex items-center gap-4 px-7 pt-7 pb-5"
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                                    style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', boxShadow: '0 4px 20px rgba(245,158,11,0.3)' }}>
                                    <Calendar className="w-6 h-6 text-amber-950" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-black text-white tracking-tight">Add Domain Monitor</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">Track domain registration expiry</p>
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
                                        <input type="text" required placeholder="e.g. Primary Marketing Site"
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
                                    <div className="flex flex-wrap gap-2">
                                        {['60 days', '30 days', '15 days', '7 days', '3 days', '1 day', 'Expired'].map((th, i) => (
                                            <span key={th} className={`text-[10px] font-black tracking-widest px-2.5 py-1 rounded-lg border ${
                                                i >= 3 ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                i >= 1 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            }`}>{th}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 px-8 pb-7" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
                                    <button type="button" onClick={handleClose}
                                        className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-400 hover:text-white transition-all"
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={submitting}
                                        className="flex-1 py-3 rounded-xl font-black text-sm text-amber-950 flex items-center justify-center gap-2 disabled:opacity-60 transition-all cursor-pointer"
                                        style={{ background: submitting ? 'rgba(245,158,11,0.5)' : 'linear-gradient(135deg, #fbbf24, #f59e0b)', boxShadow: '0 4px 20px rgba(245,158,11,0.25)' }}>
                                        {submitting ? 'Adding...' : '⏱️ Add Monitor'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {isEditing && editForm && (
                     <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
                        style={{ backgroundColor: 'rgba(3,3,3,0.88)', backdropFilter: 'blur(12px)' }}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg bg-[#0c0c0e] border border-white/10 rounded-[28px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                            <div className="p-7 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-500/10 border border-amber-500/20">
                                        <Pencil className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight">Edit Domain Monitor</h3>
                                        <p className="text-sm text-gray-500">Update configuration for {editForm.domain}</p>
                                    </div>
                                </div>
                                <button onClick={handleClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white border border-white/5">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex gap-6 px-8 pt-4">
                                <button onClick={() => setEditTab('basic')} className={`pb-2 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${editTab === 'basic' ? 'text-amber-500 border-amber-500' : 'text-gray-500 border-transparent'}`}>Basic Settings</button>
                                <button onClick={() => setEditTab('notifications')} className={`pb-2 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${editTab === 'notifications' ? 'text-amber-500 border-amber-500' : 'text-gray-500 border-transparent'}`}>Notifications</button>
                            </div>

                            <form onSubmit={handleEdit} className="flex-1 overflow-y-auto">
                                <div className="px-8 py-6 space-y-5">
                                    {editTab === 'basic' ? (
                                        <>
                                            <div>
                                                <label className={LABEL}>Friendly Name</label>
                                                <input type="text" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className={INPUT} />
                                            </div>
                                            <div>
                                                <label className={LABEL}>Domain</label>
                                                <input type="text" required value={editForm.domain} onChange={e => setEditForm({ ...editForm, domain: e.target.value })} className={INPUT + ' font-mono'} />
                                            </div>
                                            <div>
                                                <label className={LABEL}>Alert Email</label>
                                                <input type="email" value={editForm.alertEmail} onChange={e => setEditForm({ ...editForm, alertEmail: e.target.value })} className={INPUT} />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                                <p className="text-[11px] text-amber-200 leading-relaxed font-medium">Notifications trigger for WHOIS expiry milestones (60, 30, 15, 7, 3, 1 days).</p>
                                            </div>
                                            <AlertChannelSelector 
                                                selectedChannels={editForm.alertChannels}
                                                onChange={ids => setEditForm({ ...editForm, alertChannels: ids })}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 px-8 pb-7 pt-4 border-t border-white/5">
                                    <button type="button" onClick={handleClose} className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-400 bg-white/5 hover:bg-white/10 transition-all border border-white/10">Cancel</button>
                                    <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl font-black text-sm text-amber-950 flex items-center justify-center gap-2 disabled:opacity-60 transition-all" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
                                        {submitting ? 'Saving...' : 'Save Changes'}
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
