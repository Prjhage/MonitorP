'use client';

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import {
    Key, Plus, Settings2, Trash2, ShieldAlert,
    Clock, Globe, X, Save, AlertTriangle, CheckCircle2,
    Briefcase, ShieldCheck, Mail, FileText, Search, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';

// ─── Shared Styles ────────────────────────────────────────────────────────────
const INPUT = 'w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.09] text-white text-sm outline-none transition-all duration-200 placeholder-white/20 focus:bg-white/[0.06] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15';
const LABEL = 'block text-[10px] font-black uppercase tracking-[0.12em] text-gray-400 mb-1.5 ml-0.5';
const SELECT = 'w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.09] text-white text-sm outline-none transition-all duration-200 focus:bg-white/[0.06] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 appearance-none pr-9 cursor-pointer';

const SELECT_ARROW = {
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
    backgroundPosition: 'right 0.6rem center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '1.2em 1.2em',
};

const ENV_COLORS: Record<string, string> = {
    Production: 'text-red-400 bg-red-400/10 border-red-400/20',
    Staging: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    Development: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    Local: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ApiKeysPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    
    const [keys, setKeys] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        serviceName: '',
        keyType: 'Secret Key',
        keyPreview: '',
        expiryDate: '',
        environment: 'Production',
        alertEmail: user?.email || '',
        notes: ''
    });

    useEffect(() => {
        if (user?.token) {
            fetchKeys();
        }
    }, [user?.token]);

    const fetchKeys = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/api-keys');
            setKeys(data);
        } catch (error) {
            console.error('Failed to fetch keys', error);
            showToast('Failed to load API keys', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/api-keys', form);
            showToast('API Key tracked successfully', 'success');
            setIsAdding(false);
            setForm({
                serviceName: '',
                keyType: 'Secret Key',
                keyPreview: '',
                expiryDate: '',
                environment: 'Production',
                alertEmail: user?.email || '',
                notes: ''
            });
            await fetchKeys();
        } catch (error) {
            console.error('Save failed', error);
            showToast('Failed to save API key', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (id: string) => {
        confirm({
            title: 'Delete Key Tracking',
            message: 'Are you sure you want to stop tracking this key? This won\'t delete the actual key from the service, only the record here.',
            confirmText: 'Remove Record',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/api-keys/${id}`);
                    showToast('Key record removed', 'success');
                    setKeys(keys.filter(k => k._id !== id));
                } catch {
                    showToast('Failed to remove key', 'error');
                }
            }
        });
    };

    const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 25, stiffness: 100 } } };

    return (
        <motion.div initial="hidden" animate="show" variants={containerVariants} className="p-10">
            
            {/* ─── Header ─────────────────────────────────────────────── */}
            <motion.header variants={itemVariants} className="flex justify-between items-end mb-12">
                <div>
                    <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
                        Secrets & <span className="text-blue-500">API Keys</span>
                    </h1>
                    <p className="text-gray-500 font-medium max-w-lg">
                        Centralize tracking for all your external service secrets. We'll alert you before they expire to prevent production downtime.
                    </p>
                </div>
                <button id="tour-add-key" onClick={() => setIsAdding(true)} className="premium-button btn-glow-blue flex items-center gap-2 px-6">
                    <Plus className="w-5 h-5" /> Track New Key
                </button>
            </motion.header>

            {/* ─── Keys Grid ───────────────────────────────────────────── */}
            <div id="tour-keys-grid" className="mb-10 min-h-[400px]">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div 
                            key="skeleton" 
                            variants={containerVariants} 
                            initial="hidden" 
                            animate="show" 
                            exit={{ opacity: 0 }} 
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            {Array.from({ length: 3 }).map((_, i) => (
                                <motion.div key={i} variants={itemVariants} className="glass-card p-8 border border-white/[0.05] h-64 animate-pulse" />
                            ))}
                        </motion.div>
                    ) : keys.length > 0 ? (
                        <motion.div 
                            key="grid" 
                            variants={containerVariants} 
                            initial="hidden" 
                            animate="show" 
                            exit={{ opacity: 0 }} 
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            {keys.map((key) => {
                                const isExpired = key.status === 'EXPIRED';
                                const isExpiringSoon = key.status === 'EXPIRING_SOON';
                                
                                return (
                                    <motion.div 
                                        key={key._id} 
                                        variants={itemVariants}
                                        initial="hidden"
                                        animate="show"
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        layout
                                        className="glass-card p-8 border border-white/[0.05] hover:border-white/[0.1] transition-all group relative overflow-hidden"
                                    >
                                    <div className={`absolute top-0 right-0 px-4 py-1.5 text-[10px] font-black tracking-widest rounded-bl-2xl ${
                                        isExpired ? 'bg-red-500/20 text-red-400' :
                                        isExpiringSoon ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-emerald-500/20 text-emerald-400'
                                    }`}>
                                        {key.status}
                                    </div>

                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
                                            <Key className={`w-6 h-6 ${isExpired ? 'text-red-400' : isExpiringSoon ? 'text-amber-400' : 'text-blue-400'}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-white">{key.serviceName}</h3>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${ENV_COLORS[key.environment]}`}>
                                                {key.environment}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Key Type</p>
                                            <p className="text-sm text-gray-300 font-bold">{key.keyType}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Key Preview</p>
                                            <code className="text-xs bg-black/40 px-3 py-1.5 rounded-lg border border-white/[0.05] text-blue-300/80 block font-mono">
                                                {key.keyPreview}
                                            </code>
                                        </div>
                                        <div className="flex justify-between items-end pt-2">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Expires</p>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className={`text-sm font-bold ${isExpired ? 'text-red-400' : isExpiringSoon ? 'text-amber-400' : 'text-white'}`}>
                                                        {format(new Date(key.expiryDate), 'MMM d, yyyy')}
                                                        <span className="text-gray-500 text-[11px] ml-2">
                                                            ({formatDistanceToNow(new Date(key.expiryDate), { addSuffix: true })})
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button 
                                                    onClick={() => handleDelete(key._id)}
                                                    className="p-2.5 rounded-xl text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                ) : (
                    <motion.div key="empty" variants={itemVariants} initial="hidden" animate="show" exit={{ opacity: 0 }} className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[32px] bg-white/[0.01]">
                            <Key className="w-16 h-16 text-gray-800 mb-6" />
                            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">No Keys Tracked</h3>
                            <p className="text-gray-500 mb-8 max-w-md text-center">Your vault is empty. Start tracking your API keys and secrets to prevent unexpected service outages.</p>
                            <button onClick={() => setIsAdding(true)} className="premium-button btn-glow-blue flex items-center gap-3 px-8 text-lg text-white">
                                <Plus className="w-6 h-6" /> Track First Key
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ─── Add Key Modal ─────────────────────────────────────── */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: 'rgba(3,3,3,0.88)', backdropFilter: 'blur(12px)' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-xl relative overflow-hidden bg-[#0c0c0e] border border-white/10 rounded-[28px] shadow-2xl flex flex-col"
                            style={{ maxHeight: '90vh' }}
                        >
                            {/* Header */}
                            <div className="px-8 pt-8 pb-5 border-b border-white/[0.06] flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                        <Plus className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight">Track New Secret</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">We'll monitor the expiry and notify you</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsAdding(false)} className="p-2 rounded-xl text-gray-600 hover:text-white bg-white/[0.04] border border-white/[0.06] transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="overflow-y-auto px-8 py-8 space-y-6">
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className={LABEL}>Service Name</label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input type="text" required placeholder="e.g. Stripe, AWS"
                                                value={form.serviceName}
                                                onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
                                                className={INPUT} style={{ paddingLeft: '2.5rem' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={LABEL}>Key Type</label>
                                        <div className="relative">
                                            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <select 
                                                value={form.keyType}
                                                onChange={(e) => setForm({ ...form, keyType: e.target.value })}
                                                className={SELECT} style={{ paddingLeft: '2.5rem', ...SELECT_ARROW }}
                                                suppressHydrationWarning
                                            >
                                                <option value="Secret Key" className="bg-[#0c0c0e]">Secret Key</option>
                                                <option value="Access Key" className="bg-[#0c0c0e]">Access Key</option>
                                                <option value="API Key" className="bg-[#0c0c0e]">API Key</option>
                                                <option value="Auth Token" className="bg-[#0c0c0e]">Auth Token</option>
                                                <option value="Private Key" className="bg-[#0c0c0e]">Private Key</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className={LABEL}>Key Preview (Last 4 chars)</label>
                                    <div className="relative">
                                        <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input type="text" required placeholder="e.g. sk_live_...4k2f"
                                            value={form.keyPreview}
                                            onChange={(e) => setForm({ ...form, keyPreview: e.target.value })}
                                            className={INPUT} style={{ paddingLeft: '2.5rem' }} />
                                    </div>
                                    <p className="text-[10px] text-gray-600 mt-2 px-1 flex items-center gap-1.5">
                                        <AlertTriangle className="w-3 h-3 text-amber-500/60" /> 
                                        Don't enter the full key! Just a hint so you know which one it is.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className={LABEL}>Expiry Date</label>
                                        <div className="relative">
                                            <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input type="date" required
                                                value={form.expiryDate}
                                                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                                                className={INPUT} style={{ paddingLeft: '2.5rem' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={LABEL}>Environment</label>
                                        <div className="relative">
                                            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <select 
                                                value={form.environment}
                                                onChange={(e) => setForm({ ...form, environment: e.target.value })}
                                                className={SELECT} style={{ paddingLeft: '2.5rem', ...SELECT_ARROW }}
                                                suppressHydrationWarning
                                            >
                                                <option value="Production" className="bg-[#0c0c0e]">Production</option>
                                                <option value="Staging" className="bg-[#0c0c0e]">Staging</option>
                                                <option value="Development" className="bg-[#0c0c0e]">Development</option>
                                                <option value="Local" className="bg-[#0c0c0e]">Local</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className={LABEL}>Alert Recipient</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input type="email" placeholder="alerts@yourcompany.com"
                                            value={form.alertEmail}
                                            onChange={(e) => setForm({ ...form, alertEmail: e.target.value })}
                                            className={INPUT} style={{ paddingLeft: '2.5rem' }} />
                                    </div>
                                </div>

                                <div>
                                    <label className={LABEL}>Notes (Optional)</label>
                                    <div className="relative">
                                        <FileText className="absolute left-3.5 top-9 w-4 h-4 text-gray-500" />
                                        <textarea 
                                            rows={3}
                                            placeholder="Where is this key used? (e.g. Payment microservice)"
                                            value={form.notes}
                                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                            className={INPUT + ' pl-12 pt-3 resize-none'}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-4 rounded-2xl font-bold text-sm text-gray-400 hover:text-white bg-white/[0.03] border border-white/[0.06] transition-all">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={submitting} className="flex-1 btn-glow-blue py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2">
                                        {submitting ? 'Saving...' : <><Save className="w-4 h-4" /> Start Tracking</>}
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
