'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCache } from '@/context/CacheContext';
import ApiCard from '@/components/dashboard/ApiCard';
import {
    Plus, Bell, Search, Activity, ShieldCheck, Heart,
    Settings2, Code2, CheckSquare, Globe2, X, BellDot,
    Shield, Cpu, Network, Zap
} from 'lucide-react';
import AlertChannelSelector from '@/components/alerts/AlertChannelSelector';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useAuth } from '@/context/AuthContext';

// ─── Shared input/label class strings (avoids CSS layer issues) ───────────────
const INPUT =
    'w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.09] text-white text-sm outline-none transition-all duration-200 placeholder-white/20 focus:bg-white/[0.06] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15';
const SELECT =
    'w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.09] text-white text-sm outline-none transition-all duration-200 focus:bg-white/[0.06] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 appearance-none pr-9 cursor-pointer';
const LABEL =
    'block text-[10px] font-black uppercase tracking-[0.12em] text-gray-400 mb-1.5 ml-0.5';
const TEXTAREA =
    'w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.09] text-white text-sm outline-none transition-all duration-200 placeholder-white/20 focus:bg-white/[0.06] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 font-mono resize-none leading-relaxed';

const SELECT_ARROW = {
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
    backgroundPosition: 'right 0.6rem center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '1.2em 1.2em',
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface KVPair { key: string; value: string; }
interface Assertion { type: string; operator: string; value: string; jsonPath?: string; }
interface NewApiForm {
    name: string; url: string; interval: number; method: string;
    expectedStatus: number; alertEmail: string;
    headers: KVPair[]; queryParams: KVPair[];
    body: string; assertions: Assertion[];
    alertChannels: string[];
}
type ModalTab = 'basic' | 'advanced' | 'assertions' | 'notifications';

const ASSERTION_TYPES = [
    { value: 'status_code', label: 'Status Code' },
    { value: 'response_time', label: 'Response Time (ms)' },
    { value: 'body_contains', label: 'Body Contains' },
    { value: 'body_json_path', label: 'JSON Path Value' },
];
const OPERATORS: Record<string, { value: string; label: string }[]> = {
    status_code: [{ value: 'eq', label: '= equals' }, { value: 'lt', label: '< less than' }, { value: 'gt', label: '> greater than' }],
    response_time: [{ value: 'lt', label: '< less than' }, { value: 'gt', label: '> greater than' }, { value: 'eq', label: '= equals' }],
    body_contains: [{ value: 'contains', label: 'contains' }, { value: 'not_contains', label: 'does not contain' }],
    body_json_path: [{ value: 'eq', label: '= equals' }, { value: 'contains', label: 'contains' }, { value: 'not_contains', label: 'does not contain' }],
};
const EMPTY_FORM: NewApiForm = { name: '', url: '', interval: 1, method: 'GET', expectedStatus: 200, alertEmail: '', headers: [], queryParams: [], body: '', assertions: [], alertChannels: [] };

// ─── KV Editor ───────────────────────────────────────────────────────────────
function KVEditor({ label, pairs, onChange }: { label: string; pairs: KVPair[]; onChange: (p: KVPair[]) => void }) {
    const update = (i: number, field: 'key' | 'value', val: string) => {
        const u = [...pairs]; u[i] = { ...u[i], [field]: val }; onChange(u);
    };
    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <span className={LABEL}>{label}</span>
                <button type="button" onClick={() => onChange([...pairs, { key: '', value: '' }])}
                    className="flex items-center gap-1.5 text-xs font-bold text-white btn-glow-blue px-3 py-1.5 rounded-lg transition-all">
                    <Plus className="w-3 h-3" /> Add
                </button>
            </div>
            {pairs.length === 0 && (
                <div className="py-5 text-center text-xs text-gray-600 border border-dashed border-white/[0.07] rounded-xl">
                    No {label.toLowerCase()} added yet
                </div>
            )}
            <div className="space-y-2">
                {pairs.map((pair, i) => (
                    <div key={i} className="flex gap-2">
                        <input value={pair.key} onChange={(e) => update(i, 'key', e.target.value)}
                            placeholder="Key" className={INPUT + ' flex-1'} suppressHydrationWarning />
                        <input value={pair.value} onChange={(e) => update(i, 'value', e.target.value)}
                            placeholder="Value" className={INPUT + ' flex-1'} suppressHydrationWarning />
                        <button type="button" onClick={() => onChange(pairs.filter((_, idx) => idx !== i))}
                            className="p-3 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-white/[0.07] shrink-0">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Assertion Editor ─────────────────────────────────────────────────────────
function AssertionEditor({ assertions, onChange }: { assertions: Assertion[]; onChange: (a: Assertion[]) => void }) {
    const update = (i: number, field: keyof Assertion, val: string) => {
        const u = [...assertions];
        if (field === 'type') u[i] = { type: val, operator: OPERATORS[val][0].value, value: '' };
        else u[i] = { ...u[i], [field]: val };
        onChange(u);
    };
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <span className={LABEL}>Assertion Rules</span>
                <button type="button"
                    onClick={() => onChange([...assertions, { type: 'response_time', operator: 'lt', value: '500' }])}
                    className="flex items-center gap-1.5 text-xs font-bold text-white btn-glow-purple px-3 py-1.5 rounded-lg transition-all">
                    <Plus className="w-3 h-3" /> Add Rule
                </button>
            </div>
            {assertions.length === 0 && (
                <div className="py-10 text-center border border-dashed border-white/[0.07] rounded-2xl">
                    <CheckSquare className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                    <p className="text-xs text-gray-600">No assertions yet. Add rules to validate your API's response.</p>
                </div>
            )}
            <div className="space-y-3">
                {assertions.map((a, i) => (
                    <div key={i} className="p-4 bg-white/[0.02] border border-white/[0.07] rounded-2xl space-y-2.5">
                        <div className="flex gap-2">
                            <select value={a.type} onChange={(e) => update(i, 'type', e.target.value)}
                                className={SELECT + ' flex-1'} style={SELECT_ARROW} suppressHydrationWarning>
                                {ASSERTION_TYPES.map(t => <option key={t.value} value={t.value} className="bg-[#0d0d0d]">{t.label}</option>)}
                            </select>
                            <select value={a.operator} onChange={(e) => update(i, 'operator', e.target.value)}
                                className={SELECT + ' flex-1'} style={SELECT_ARROW} suppressHydrationWarning>
                                {(OPERATORS[a.type] || []).map(o => <option key={o.value} value={o.value} className="bg-[#0d0d0d]">{o.label}</option>)}
                            </select>
                            <button type="button" onClick={() => onChange(assertions.filter((_, idx) => idx !== i))}
                                className="p-3 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-white/[0.07] shrink-0">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex gap-2">
                            {a.type === 'body_json_path' && (
                                <input value={a.jsonPath || ''} onChange={(e) => update(i, 'jsonPath', e.target.value)}
                                    placeholder="JSON path (e.g. data.status)" className={INPUT + ' flex-1'} suppressHydrationWarning />
                            )}
                            <input value={a.value} onChange={(e) => update(i, 'value', e.target.value)}
                                placeholder={a.type === 'response_time' ? 'e.g. 300ms' : a.type === 'status_code' ? 'e.g. 200' : 'expected value'}
                                className={INPUT + ' flex-1'} suppressHydrationWarning />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────
export default function DashboardPage() {
    const { apis, heartbeats, ssls, tcps, dns, domains, loading, addApi, toggleApi, deleteApi } = useCache();
    const router = useRouter();
    const { showToast } = useToast();
    const { confirm: askConfirm } = useConfirm();
    const { isAtLeast } = useAuth();
    const [isAdding, setIsAdding] = useState(false);
    const [activeTab, setActiveTab] = useState<ModalTab>('basic');
    const [newApi, setNewApi] = useState<NewApiForm>(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);

    const handleTogglePause = async (id: string, isActive: boolean) => {
        try {
            await toggleApi(id);
            showToast(isActive ? 'Monitor paused' : 'Monitor resumed', 'success');
        } catch (err) {
            showToast('Failed to toggle monitor', 'error');
        }
    };

    const handleDelete = (id: string, name: string) => {
        askConfirm({
            title: 'Delete Monitor',
            message: `Are you sure you want to delete "${name}"? All monitoring history will be lost.`,
            confirmText: 'Delete',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await deleteApi(id);
                    showToast('Monitor deleted successfully', 'success');
                } catch (err) {
                    showToast('Failed to delete monitor', 'error');
                }
            },
        });
    };

    const handleAddApi = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await addApi(newApi);
            setIsAdding(false);
            setNewApi(EMPTY_FORM);
            setActiveTab('basic');
        } catch (err) {
            console.error('Failed to add API', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => { setIsAdding(false); setNewApi(EMPTY_FORM); setActiveTab('basic'); };

    const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 25, stiffness: 100 } } };

    const tabs: { id: ModalTab; label: string; icon: React.ElementType }[] = [
        { id: 'basic', label: 'Basic', icon: Settings2 },
        { id: 'advanced', label: 'Advanced', icon: Code2 },
        { id: 'assertions', label: 'Assertions', icon: CheckSquare },
        { id: 'notifications', label: 'Notifications', icon: BellDot },
    ];

    return (
        <motion.div initial="hidden" animate="show" variants={containerVariants} className="p-10">

            {/* ─── Header ─────────────────────────────────────────────── */}
            <motion.header variants={itemVariants} className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
                        Platform <span className="text-blue-500">Overview</span>
                    </h2>
                    <p className="text-gray-500 font-medium">
                        Real-time status of your <span className="text-white font-bold">entire infrastructure</span>
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div id="tour-search" className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 group-focus-within:text-blue-400 transition-colors" />
                        <input type="text" placeholder="Global search..." className="premium-input pl-12 pr-4 py-2.5 w-72" suppressHydrationWarning />
                    </div>
                    {isAtLeast('admin') && (
                        <div className="flex items-center gap-2">
                            <button id="tour-add-monitor" onClick={() => setIsAdding(true)} className="premium-button btn-glow-blue flex items-center gap-2" suppressHydrationWarning>
                                <Plus className="w-5 h-5" /> New API Monitor
                            </button>
                        </div>
                    )}
                </div>
            </motion.header>

            {/* ─── Summary Stats Section ─────────────────────────────── */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                {/* Global Health Card */}
                <div className="glass-card p-6 border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Global Health
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-black text-white">
                                {(() => {
                                    const total = (apis?.length || 0) + (heartbeats?.length || 0) + (ssls?.length || 0) + (tcps?.length || 0) + (dns?.length || 0) + (domains?.length || 0);
                                    if (total === 0) return 100;
                                    const up = 
                                        (apis?.filter(a => a.status === 'UP').length || 0) + 
                                        (heartbeats?.filter(h => h.status === 'UP' || h.status === 'RUNNING').length || 0) +
                                        (ssls?.filter(s => s.status === 'ok').length || 0) +
                                        (tcps?.filter(t => t.status === 'ok').length || 0) +
                                        (dns?.filter(d => d.status === 'ok').length || 0) +
                                        (domains?.filter(dm => (dm as any).daysRemaining > 0).length || 0);
                                    return Math.round((up / total) * 100);
                                })()}%
                            </span>
                            <span className="text-emerald-400 text-xs font-black mb-1.5 uppercase">Operational</span>
                        </div>
                        <div className="mt-3 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(() => {
                                    const total = (apis?.length || 0) + (heartbeats?.length || 0) + (ssls?.length || 0) + (tcps?.length || 0) + (dns?.length || 0) + (domains?.length || 0);
                                    if (total === 0) return 100;
                                    const up = 
                                        (apis?.filter(a => a.status === 'UP').length || 0) + 
                                        (heartbeats?.filter(h => h.status === 'UP' || h.status === 'RUNNING').length || 0) +
                                        (ssls?.filter(s => s.status === 'ok').length || 0) +
                                        (tcps?.filter(t => t.status === 'ok').length || 0) +
                                        (dns?.filter(d => d.status === 'ok').length || 0) +
                                        (domains?.filter(dm => (dm as any).daysRemaining > 0).length || 0);
                                    return (up / total) * 100;
                                })()}%` }}
                                className="h-full bg-emerald-500"
                            />
                        </div>
                    </div>
                </div>

                {/* API Monitors Card */}
                <div 
                    onClick={() => router.push('/dashboard')}
                    className="glass-card p-6 border border-white/5 cursor-pointer hover:border-blue-500/30 transition-all group"
                >
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-400" /> API Monitors
                    </div>
                    <div className="flex justify-between items-end">
                        <div className="text-3xl font-black text-white">{apis?.length || 0}</div>
                        <div className="text-right">
                            <div className="text-[10px] font-black text-emerald-400 uppercase">{apis?.filter(a => a.status === 'UP').length || 0} Online</div>
                            <div className="text-[10px] font-black text-red-400 uppercase">{apis?.filter(a => a.status === 'DOWN').length || 0} Offline</div>
                        </div>
                    </div>
                </div>

                {/* Heartbeats Card */}
                <div 
                    onClick={() => router.push('/dashboard/heartbeats')}
                    className="glass-card p-6 border border-white/5 cursor-pointer hover:border-pink-500/30 transition-all group"
                >
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Heart className="w-4 h-4 text-pink-400" /> Heartbeats
                    </div>
                    <div className="flex justify-between items-end">
                        <div className="text-3xl font-black text-white">{heartbeats?.length || 0}</div>
                        <div className="text-right">
                            <div className="text-[10px] font-black text-emerald-400 uppercase">{heartbeats?.filter(h => h.status === 'UP' || h.status === 'RUNNING').length || 0} Healthy</div>
                            <div className="text-[10px] font-black text-red-400 uppercase">{heartbeats?.filter(h => h.status === 'DOWN').length || 0} Missed</div>
                        </div>
                    </div>
                </div>

                {/* Active Incidents Card */}
                <div 
                    onClick={() => router.push('/dashboard/incidents')}
                    className="glass-card p-6 border border-white/5 cursor-pointer hover:border-red-500/30 transition-all group"
                >
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <BellDot className="w-4 h-4 text-red-500" /> Incidents
                    </div>
                    <div className="flex justify-between items-end">
                        <div className={(() => {
                            const downCount = 
                                (apis?.filter(a => a.status === 'DOWN').length || 0) + 
                                (heartbeats?.filter(h => h.status === 'DOWN').length || 0) +
                                (ssls?.filter(s => s.status === 'expired' || s.status === 'error').length || 0) +
                                (tcps?.filter(t => t.status === 'failed').length || 0) +
                                (dns?.filter(d => d.status === 'failed').length || 0) +
                                (domains?.filter(dm => (dm as any).daysRemaining <= 0).length || 0);
                            return `text-3xl font-black ${downCount > 0 ? 'text-red-500' : 'text-white'}`;
                        })()}>
                            {(() => {
                                return (
                                    (apis?.filter(a => a.status === 'DOWN').length || 0) + 
                                    (heartbeats?.filter(h => h.status === 'DOWN').length || 0) +
                                    (ssls?.filter(s => s.status === 'expired' || s.status === 'error').length || 0) +
                                    (tcps?.filter(t => t.status === 'failed').length || 0) +
                                    (dns?.filter(d => d.status === 'failed').length || 0) +
                                    (domains?.filter(dm => (dm as any).daysRemaining <= 0).length || 0)
                                );
                            })()}
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black text-gray-400 uppercase">Active Now</div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ─── Infrastructure Inventory ─────────────────────────── */}
            <motion.div variants={itemVariants} className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                    <Shield className="w-5 h-5 text-blue-500" />
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Infrastructure Fleet</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="glass-card p-5 border border-white/5 hover:border-blue-500/20 transition-all cursor-pointer" onClick={() => router.push('/dashboard/ssl')}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <ShieldCheck className="w-4 h-4 text-blue-400" />
                            </div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">SSL Certs</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-2xl font-black text-white">{ssls?.length || 0}</span>
                            <span className="text-[9px] font-bold text-emerald-400 mb-1">{ssls?.filter(s => s.status === 'ok').length || 0} Valid</span>
                        </div>
                    </div>

                    <div className="glass-card p-5 border border-white/5 hover:border-purple-500/20 transition-all cursor-pointer" onClick={() => router.push('/dashboard/tcp')}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <Cpu className="w-4 h-4 text-purple-400" />
                            </div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">TCP Ports</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-2xl font-black text-white">{tcps?.length || 0}</span>
                            <span className="text-[9px] font-bold text-emerald-400 mb-1">{tcps?.filter(t => t.status === 'ok').length || 0} Open</span>
                        </div>
                    </div>

                    <div className="glass-card p-5 border border-white/5 hover:border-cyan-500/20 transition-all cursor-pointer" onClick={() => router.push('/dashboard/dns')}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                <Network className="w-4 h-4 text-cyan-400" />
                            </div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">DNS Records</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-2xl font-black text-white">{dns?.length || 0}</span>
                            <span className="text-[9px] font-bold text-emerald-400 mb-1">{dns?.filter(d => d.status === 'ok').length || 0} Correct</span>
                        </div>
                    </div>

                    <div className="glass-card p-5 border border-white/5 hover:border-orange-500/20 transition-all cursor-pointer" onClick={() => router.push('/dashboard/domains')}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                <Globe2 className="w-4 h-4 text-orange-400" />
                            </div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Domains</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-2xl font-black text-white">{domains?.length || 0}</span>
                            <span className="text-[9px] font-bold text-emerald-400 mb-1">{(domains as any)?.filter((dm: any) => dm.daysRemaining > 0).length || 0} Active</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ─── Monitors Summary ─────────────────────────────────────────── */}
            <div className="mb-12">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">
                        <Activity className="w-4 h-4 text-blue-500" /> Infrastructure Status
                    </h3>
                    <button onClick={() => refreshAll()} className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors">
                        Refresh All
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Critical Issues / Active Incidents */}
                    <div className="glass-card p-8 border border-red-500/10 bg-red-500/[0.01]">
                        <div className="flex items-center gap-3 mb-6">
                            <BellDot className="w-5 h-5 text-red-500" />
                            <h4 className="text-lg font-black text-white">Critical Issues</h4>
                        </div>
                        <div className="space-y-4">
                            {(() => {
                                const downApis = apis.filter(a => a.status === 'DOWN');
                                const downHbs = heartbeats.filter(h => h.status === 'DOWN');
                                const issues: any[] = [...downApis.map(a => ({ ...a, type: 'API' })), ...downHbs.map(h => ({ ...h, type: 'Heartbeat' }))];
                                
                                if (issues.length === 0) return (
                                    <div className="py-10 text-center border border-dashed border-white/5 rounded-2xl">
                                        <ShieldCheck className="w-8 h-8 text-emerald-500/20 mx-auto mb-2" />
                                        <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">No active incidents</p>
                                    </div>
                                );

                                return issues.map((issue: any) => (
                                    <div key={issue._id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                            <div>
                                                <div className="text-sm font-black text-white">{issue.name}</div>
                                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{issue.type} • {issue.url || issue.slug}</div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => router.push(`/dashboard/${issue.type === 'API' ? issue._id : 'heartbeats/' + issue._id}`)}
                                            className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:underline"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>

                    {/* Recent Statuses Mix */}
                    <div className="glass-card p-8 border border-white/5">
                        <div className="flex items-center gap-3 mb-6">
                            <Activity className="w-5 h-5 text-blue-500" />
                            <h4 className="text-lg font-black text-white">Live Activity Feed</h4>
                        </div>
                        <div className="space-y-4">
                            {(() => {
                                const recentItems: any[] = [...apis.slice(0, 3), ...heartbeats.slice(0, 3)].sort((a: any, b: any) => new Date(b.lastChecked || b.lastPingAt).getTime() - new Date(a.lastChecked || a.lastPingAt).getTime());
                                return recentItems.map((item: any) => (
                                    <div key={item._id} className="flex items-center gap-4 p-4 border-b border-white/[0.03] last:border-0">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                                            item.status === 'UP' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
                                            item.status === 'DOWN' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 
                                            'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                        }`}>
                                            {item.url ? <Globe2 className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <span className="text-sm font-black text-white">{item.name}</span>
                                                <span className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter">
                                                    {new Date(item.lastChecked || item.lastPingAt).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <div className="text-[10px] font-medium text-gray-500 truncate max-w-[200px]">{item.url || item.slug}</div>
                                        </div>
                                    </div>
                                ));
                            })()}
                            {apis.length === 0 && heartbeats.length === 0 && (
                                <p className="text-center py-10 text-xs text-gray-600">No recent activity detected.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>


            {/* ─── Add API Modal ─────────────────────────────────────── */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: 'rgba(3,3,3,0.88)', backdropFilter: 'blur(12px)' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="w-full max-w-2xl relative overflow-hidden flex flex-col shadow-2xl"
                            style={{
                                background: '#0c0c0e',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '28px',
                                maxHeight: '88vh',
                                boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(59,130,246,0.1)',
                            }}>

                            {/* Glow accents */}
                            <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }} />
                            <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }} />

                            {/* Header */}
                            <div className="relative z-10 flex items-center gap-4 px-7 pt-7 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                                    style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 4px 20px rgba(59,130,246,0.3)' }}>
                                    <Activity className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-black text-white tracking-tight">Add New Monitor</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">Configure endpoint tracking with assertions &amp; advanced options</p>
                                </div>
                                <button onClick={handleClose}
                                    className="p-2 rounded-xl text-gray-600 hover:text-white transition-all"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Tab bar */}
                            <div id="tour-form-tabs" className="relative z-10 flex gap-1.5 px-7 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                {tabs.map((tab) => {
                                    const isActive = activeTab === tab.id;
                                    const count = tab.id === 'assertions' ? newApi.assertions.length :
                                        tab.id === 'advanced' ? newApi.headers.length + newApi.queryParams.length : 
                                        tab.id === 'notifications' ? newApi.alertChannels.length : 0;
                                    return (
                                        <button key={tab.id} type="button"
                                            id={`tour-tab-${tab.id}`}
                                            onClick={() => setActiveTab(tab.id)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200"
                                            style={isActive ? {
                                                background: 'linear-gradient(135deg, rgba(59,130,246,0.9), rgba(99,102,241,0.9))',
                                                color: 'white',
                                                boxShadow: '0 4px 16px rgba(59,130,246,0.25)',
                                            } : { color: '#6b7280', background: 'transparent' }}
                                            onMouseEnter={e => { if (!isActive) (e.target as HTMLElement).closest('button')!.style.color = '#fff'; }}
                                            onMouseLeave={e => { if (!isActive) (e.target as HTMLElement).closest('button')!.style.color = '#6b7280'; }}>
                                            <tab.icon className="w-4 h-4" />
                                            {tab.label}
                                            {count > 0 && (
                                                <span className="text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center text-white"
                                                    style={{ background: tab.id === 'assertions' ? '#7c3aed' : '#059669' }}>
                                                    {count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Form body */}
                            <form onSubmit={handleAddApi} className="flex flex-col flex-1 overflow-hidden relative z-10">
                                <div className="px-8 pt-6 pb-12 overflow-y-auto max-h-[75vh] custom-scrollbar">
                                    <AnimatePresence mode="wait">

                                        {/* ── Basic Tab ────────────────────────── */}
                                        {activeTab === 'basic' && (
                                            <motion.div key="basic" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="space-y-5">
                                                <div id="tour-form-name">
                                                    <label className={LABEL}>Friendly Name</label>
                                                    <div className="relative">
                                                        <Activity className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                                        <input type="text" required placeholder="e.g. Payment Gateway API"
                                                            value={newApi.name}
                                                            onChange={(e) => setNewApi({ ...newApi, name: e.target.value })}
                                                            className={INPUT} style={{ paddingLeft: '2.5rem' }} suppressHydrationWarning />
                                                    </div>
                                                </div>
                                                <div id="tour-form-url">
                                                    <label className={LABEL}>Endpoint URL</label>
                                                    <div className="relative">
                                                        <Globe2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                                        <input type="url" required placeholder="https://api.yourcompany.com/health"
                                                            value={newApi.url}
                                                            onChange={(e) => setNewApi({ ...newApi, url: e.target.value })}
                                                            className={INPUT} style={{ paddingLeft: '2.5rem' }} suppressHydrationWarning />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className={LABEL}>HTTP Method</label>
                                                        <select value={newApi.method} style={{ ...SELECT_ARROW }}
                                                            onChange={(e) => setNewApi({ ...newApi, method: e.target.value })}
                                                            className={SELECT} suppressHydrationWarning>
                                                            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'].map(m => (
                                                                <option key={m} value={m} className="bg-[#0d0d0d]">{m}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className={LABEL}>Expected Status</label>
                                                        <div className="relative">
                                                            <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                                            <input type="number" defaultValue={200}
                                                                onChange={(e) => setNewApi({ ...newApi, expectedStatus: parseInt(e.target.value) })}
                                                                className={INPUT} style={{ paddingLeft: '2.5rem' }} suppressHydrationWarning />
                                                        </div>
                                                    </div>
                                                    <div id="tour-form-frequency">
                                                        <label className={LABEL}>Check Interval</label>
                                                        <select value={newApi.interval} style={{ ...SELECT_ARROW }}
                                                            onChange={(e) => setNewApi({ ...newApi, interval: parseInt(e.target.value) })}
                                                            className={SELECT} suppressHydrationWarning>
                                                            <option value={60} className="bg-[#0d0d0d]">Every 1 Minute</option>
                                                            <option value={300} className="bg-[#0d0d0d]">Every 5 Minutes</option>
                                                            <option value={900} className="bg-[#0d0d0d]">Every 15 Minutes</option>
                                                            <option value={1800} className="bg-[#0d0d0d]">Every 30 Minutes</option>
                                                            <option value={3600} className="bg-[#0d0d0d]">Every 1 Hour</option>
                                                        </select>
                                                    </div>
                                                    <div id="tour-form-email">
                                                        <label className={LABEL}>Alert Email</label>
                                                        <div className="relative">
                                                            <Bell className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                                            <input type="email" placeholder="alerts@company.com"
                                                                value={newApi.alertEmail || ''}
                                                                onChange={(e) => setNewApi({ ...newApi, alertEmail: e.target.value })}
                                                                className={INPUT} style={{ paddingLeft: '2.5rem' }} suppressHydrationWarning />
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* ── Advanced Tab ─────────────────────── */}
                                        {activeTab === 'advanced' && (
                                            <motion.div key="advanced" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="space-y-7">
                                                <div id="tour-form-headers">
                                                    <KVEditor label="Request Headers" pairs={newApi.headers}
                                                        onChange={(h) => setNewApi({ ...newApi, headers: h })} />
                                                </div>
                                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
                                                <div id="tour-form-params">
                                                    <KVEditor label="Query Parameters" pairs={newApi.queryParams}
                                                        onChange={(q) => setNewApi({ ...newApi, queryParams: q })} />
                                                </div>
                                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
                                                <div id="tour-form-body">
                                                    <label className={LABEL}>Request Body (JSON)</label>
                                                    <textarea rows={5} value={newApi.body}
                                                        id="tour-form-body-input"
                                                        onChange={(e) => setNewApi({ ...newApi, body: e.target.value })}
                                                        placeholder={'{\n  "key": "value"\n}'}
                                                        className={TEXTAREA} />
                                                    <p className="text-[11px] text-gray-600 mt-1.5 ml-1">Only sent for POST, PUT and PATCH methods.</p>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* ── Assertions Tab ────────────────────── */}
                                        {activeTab === 'assertions' && (
                                            <motion.div key="assertions" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}>
                                                <div id="tour-form-assertions">
                                                    <div className="mb-5 p-4 rounded-2xl" style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)' }}>
                                                        <p className="text-xs text-violet-300 leading-relaxed">
                                                            <span className="font-black">Assertions</span> are rules evaluated on every ping. If any rule fails, the monitor is marked as <span className="font-bold text-amber-400">DEGRADED</span>.
                                                        </p>
                                                    </div>
                                                    <AssertionEditor assertions={newApi.assertions}
                                                        onChange={(a) => setNewApi({ ...newApi, assertions: a })} />
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* ── Notifications Tab ──────────────────── */}
                                        {activeTab === 'notifications' && (
                                            <motion.div key="notifications" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="space-y-6">
                                                <div id="tour-form-notifications">
                                                    <div className="mb-6 p-4 rounded-2xl" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
                                                        <p className="text-xs text-blue-300 leading-relaxed">
                                                            <span className="font-black text-white">Multi-Channel Alerts:</span> Select which channels should receive notifications for this monitor. Incident alerts will be dispatched to all selected targets simultaneously.
                                                        </p>
                                                    </div>
                                                    
                                                    <label className={LABEL}>Select Alert Channels</label>
                                                    <AlertChannelSelector 
                                                        selectedChannels={newApi.alertChannels}
                                                        onChange={(ids) => setNewApi({ ...newApi, alertChannels: ids })}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}

                                    </AnimatePresence>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between gap-4 px-7 py-5 relative z-10"
                                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    {/* Step dots */}
                                    <div className="flex gap-1.5">
                                        {tabs.map((tab) => (
                                            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                                                className="h-1.5 rounded-full transition-all duration-300"
                                                style={{ width: activeTab === tab.id ? '1.5rem' : '0.375rem', background: activeTab === tab.id ? '#3b82f6' : 'rgba(255,255,255,0.15)' }} />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button type="button" onClick={handleClose}
                                            className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-400 hover:text-white transition-all"
                                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                            Cancel
                                        </button>
                                        {activeTab !== 'notifications' && (
                                            <button type="button"
                                                onClick={() => {
                                                    if (activeTab === 'basic') setActiveTab('advanced');
                                                    else if (activeTab === 'advanced') setActiveTab('assertions');
                                                    else if (activeTab === 'assertions') setActiveTab('notifications');
                                                }}
                                                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white btn-glow-blue transition-all">
                                                Next →
                                            </button>
                                        )}
                                        <button id="tour-form-submit" type="submit" disabled={submitting}
                                            className="premium-button btn-glow-emerald py-2.5 px-7 text-sm disabled:opacity-50">
                                            {submitting ? 'Saving...' : '✓ Start Monitoring'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
