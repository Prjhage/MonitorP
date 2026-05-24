'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SslCard from '@/components/dashboard/SslCard';
import api from '@/services/api';
import { Plus, Search, X, Globe, Bell, Lock, BellDot } from 'lucide-react';
import AlertChannelSelector from '@/components/alerts/AlertChannelSelector';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useAuth } from '@/context/AuthContext';

const INPUT = 'w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.09] text-white text-sm outline-none transition-all duration-200 placeholder-white/20 focus:bg-white/[0.06] focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/15';
const LABEL = 'block text-[10px] font-black uppercase tracking-[0.12em] text-gray-400 mb-1.5 ml-0.5';

const EMPTY_FORM = { name: '', domain: '', alertEmail: '', alertChannels: [] as string[] };

const getSslUrl = (path: string) => {
    let base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    base = base.replace(/\/apis$/, ''); // Just in case it's pointing to /apis
    return `${base}/ssl${path}`;
};

export default function SslPage() {
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
            const { data } = await api.get(getSslUrl(''));
            setMonitors(data);
        } catch (err) {
            console.error('Failed to fetch SSL monitors', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMonitors(); }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const finalUrl = getSslUrl('');
            console.log('Sending Add SSL request to:', finalUrl);
            const { data } = await api.post(finalUrl, form);
            setMonitors(prev => [data, ...prev]);
            setIsAdding(false);
            setForm(EMPTY_FORM);
            showToast('SSL monitor added — checking certificate now...', 'success');
            // Poll after 4s for the initial check result
            setTimeout(() => fetchMonitors(), 4500);
        } catch (err: any) {
            console.error('Failed to add SSL monitor', err);
            showToast(err?.response?.data?.message || 'Failed to add SSL monitor', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleTogglePause = async (id: string, isActive: boolean) => {
        try {
            const { data } = await api.patch(getSslUrl(`/${id}/toggle`));
            setMonitors(prev => prev.map(m => m._id === id ? data : m));
            showToast(isActive ? 'Monitor paused' : 'Monitor resumed', 'success');
        } catch (err) {
            showToast('Failed to toggle monitor', 'error');
        }
    };

    const handleDelete = (id: string, name: string) => {
        askConfirm({
            title: 'Delete SSL Monitor',
            message: `Are you sure you want to delete "${name}"? All monitoring history will be lost.`,
            confirmText: 'Delete',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(getSslUrl(`/${id}`));
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
        m.domain.toLowerCase().includes(search.toLowerCase()) ||
        m.name.toLowerCase().includes(search.toLowerCase())
    );

    // Summary stats
    const valid   = monitors.filter(m => m.status === 'VALID').length;
    const expiring = monitors.filter(m => m.status === 'EXPIRING_SOON').length;
    const expired  = monitors.filter(m => m.status === 'EXPIRED' || m.status === 'ERROR').length;

    return (
        <motion.div initial="hidden" animate="show" variants={containerVariants} className="p-10">

            {/* ─── Header ───────────────────────────────────────────────── */}
            <motion.header variants={itemVariants} className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
                        SSL <span className="text-teal-400">Certificates</span>
                    </h2>
                    <p className="text-gray-500 font-medium">
                        Monitoring <span className="text-white font-bold">{monitors.length}</span> SSL certificates
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div id="tour-ssl-search" className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 group-focus-within:text-teal-400 transition-colors" />
                        <input type="text" placeholder="Find certificate..." value={search} onChange={e => setSearch(e.target.value)}
                            className="premium-input pl-12 pr-4 py-2.5 w-72" suppressHydrationWarning />
                    </div>
                    {isAtLeast('admin') && (
                        <button id="tour-add-ssl" onClick={() => setIsAdding(true)} suppressHydrationWarning
                            className="premium-button flex items-center gap-2"
                            style={{ background: 'linear-gradient(135deg, #0d9488, #0891b2)' }}>
                            <Plus className="w-5 h-5" /> Add SSL Monitor
                        </button>
                    )}
                </div>
            </motion.header>

            {/* ─── Summary strip ────────────────────────────────────────── */}
            {monitors.length > 0 && (
                <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4 mb-10">
                    {[
                        { label: 'Valid', value: valid, color: 'text-emerald-400', bg: 'bg-emerald-500/8', border: 'border-emerald-500/15' },
                        { label: 'Expiring Soon', value: expiring, color: 'text-amber-400', bg: 'bg-amber-500/8', border: 'border-amber-500/15' },
                        { label: 'Expired / Error', value: expired, color: 'text-red-400', bg: 'bg-red-500/8', border: 'border-red-500/15' },
                    ].map(stat => (
                        <div key={stat.label} className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border ${stat.bg} ${stat.border}`}>
                            <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</span>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* ─── Grid ────────────────────────────────────────────────── */}
            <div id="tour-ssl-grid" className="min-h-[100px]">
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
                                    <SslCard
                                        monitor={m}
                                        onClick={() => router.push(`/dashboard/ssl/${m._id}`)}
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
                                style={{ background: 'rgba(13,148,136,0.1)', borderColor: 'rgba(13,148,136,0.2)' }}>
                                <Lock className="w-10 h-10 text-teal-500 animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">No SSL Monitors</h3>
                            <p className="text-gray-500 mb-8 font-medium text-center max-w-xs">
                                Add a domain to start tracking SSL certificate expiry and chain validity.
                            </p>
                            <button onClick={() => setIsAdding(true)} suppressHydrationWarning
                                className="premium-button flex items-center gap-3 px-8 text-lg"
                                style={{ background: 'linear-gradient(135deg, #0d9488, #0891b2)' }}>
                                <Plus className="w-6 h-6" /> Add Your First SSL Monitor
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ─── Add Monitor Modal ────────────────────────────────────── */}
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
                                boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(13,148,136,0.15)',
                            }}>

                            {/* Glow accents */}
                            <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
                                style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.08) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }} />

                            {/* Header */}
                            <div className="relative z-10 flex items-center gap-4 px-7 pt-7 pb-5"
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                                    style={{ background: 'linear-gradient(135deg, #0d9488, #0891b2)', boxShadow: '0 4px 20px rgba(13,148,136,0.3)' }}>
                                    <Lock className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-black text-white tracking-tight">Add SSL Monitor</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">We'll check the certificate and alert you before it expires</p>
                                </div>
                                <button onClick={handleClose}
                                    className="p-2 rounded-xl text-gray-600 hover:text-white transition-all"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleAdd} className="relative z-10">
                                <div className="px-8 pt-6 pb-8 space-y-5">

                                    <div>
                                        <label className={LABEL}>Friendly Name</label>
                                        <input id="tour-ssl-form-name" type="text" required placeholder="e.g. Production API"
                                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                            className={INPUT} suppressHydrationWarning />
                                    </div>

                                    <div>
                                        <label className={LABEL}>Domain</label>
                                        <div className="relative">
                                            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                            <input id="tour-ssl-form-domain" type="text" required placeholder="example.com"
                                                value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })}
                                                className={INPUT + ' font-mono'} style={{ paddingLeft: '2.5rem' }} suppressHydrationWarning />
                                        </div>
                                        <p className="text-[11px] text-gray-600 mt-1.5 ml-1">
                                            Enter just the domain name — no https:// or paths needed.
                                        </p>
                                    </div>

                                    <div>
                                        <label className={LABEL}>Alert Email</label>
                                        <div className="relative mb-5">
                                            <Bell className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                            <input id="tour-ssl-form-email" type="email" placeholder="alerts@company.com"
                                                value={form.alertEmail} onChange={e => setForm({ ...form, alertEmail: e.target.value })}
                                                className={INPUT} style={{ paddingLeft: '2.5rem' }} suppressHydrationWarning />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={LABEL}>Notification Channels</label>
                                        <AlertChannelSelector 
                                            selectedChannels={form.alertChannels}
                                            onChange={(ids) => setForm({ ...form, alertChannels: ids })}
                                        />
                                    </div>

                                    {/* Alert schedule info */}
                                    <div className="flex flex-wrap gap-2">
                                        {['30 days', '15 days', '7 days', '1 day', 'Expired'].map((th, i) => (
                                            <span key={i} className={`text-[10px] font-black tracking-widest px-2.5 py-1 rounded-lg border ${
                                                i >= 3 ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                i >= 2 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                'bg-teal-500/10 text-teal-400 border-teal-500/20'
                                            }`}>{th}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex gap-3 px-8 pb-7" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
                                    <button type="button" onClick={handleClose}
                                        className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-400 hover:text-white transition-all"
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                        Cancel
                                    </button>
                                    <button id="tour-ssl-form-submit" type="submit" disabled={submitting}
                                        className="flex-1 py-3 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                                        style={{ background: submitting ? 'rgba(13,148,136,0.5)' : 'linear-gradient(135deg, #0d9488, #0891b2)', boxShadow: '0 4px 20px rgba(13,148,136,0.25)' }}>
                                        {submitting ? 'Adding...' : '🔒 Start Monitoring'}
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
