'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCache } from '@/context/CacheContext';
import ApiCard from '@/components/dashboard/ApiCard';
import {
    Plus, Bell, Search, Activity, ShieldCheck,
    Settings2, Code2, CheckSquare, Globe2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Shared input/label class strings (avoids CSS layer issues) ───────────────
const INPUT =
    'w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.09] text-white text-sm outline-none transition-all duration-200 placeholder-white/20 focus:bg-white/[0.06] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15';
const SELECT =
    'w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.09] text-white text-sm outline-none transition-all duration-200 focus:bg-white/[0.06] focus:border-blue-500/60 appearance-none pr-9 cursor-pointer';
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
}
type ModalTab = 'basic' | 'advanced' | 'assertions';

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
const EMPTY_FORM: NewApiForm = { name: '', url: '', interval: 1, method: 'GET', expectedStatus: 200, alertEmail: '', headers: [], queryParams: [], body: '', assertions: [] };

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
                    className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-all">
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
                    className="flex items-center gap-1.5 text-xs font-bold text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 px-3 py-1.5 rounded-lg transition-all">
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
                                className={SELECT + ' flex-1'} style={SELECT_ARROW}>
                                {ASSERTION_TYPES.map(t => <option key={t.value} value={t.value} className="bg-[#0d0d0d]">{t.label}</option>)}
                            </select>
                            <select value={a.operator} onChange={(e) => update(i, 'operator', e.target.value)}
                                className={SELECT + ' flex-1'} style={SELECT_ARROW}>
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
    const { apis, loading, addApi } = useCache();
    const router = useRouter();
    const [isAdding, setIsAdding] = useState(false);
    const [activeTab, setActiveTab] = useState<ModalTab>('basic');
    const [newApi, setNewApi] = useState<NewApiForm>(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);

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
                        Monitoring <span className="text-white font-bold">{apis.length}</span> individual service endpoints
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 group-focus-within:text-blue-400 transition-colors" />
                        <input type="text" placeholder="Find API monitor..." className="premium-input pl-12 pr-4 py-2.5 w-72" suppressHydrationWarning />
                    </div>
                    <button className="p-3 bg-white/[0.03] text-gray-400 hover:text-white rounded-xl border border-white/[0.06] transition-all hover:border-white/10" suppressHydrationWarning>
                        <Bell className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsAdding(true)} className="premium-button flex items-center gap-2" suppressHydrationWarning>
                        <Plus className="w-5 h-5" /> Add Monitor
                    </button>
                </div>
            </motion.header>

            {/* ─── API Grid ───────────────────────────────────────────── */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                    {apis.map((a) => (
                        <motion.div key={a._id} variants={itemVariants} layout initial="hidden" animate="show"
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}>
                            <ApiCard api={a} onClick={() => router.push(`/dashboard/${a._id}`)} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {/* Loading Skeleton */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="glass-card p-8 border border-white/[0.05] relative overflow-hidden h-[340px]">
                            <div className="flex justify-between items-start mb-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-3 h-3 rounded-full bg-white/5 animate-pulse" />
                                    <div className="space-y-2">
                                        <div className="h-5 w-32 bg-white/5 rounded-full animate-pulse" />
                                        <div className="h-2 w-20 bg-white/5 rounded-full animate-pulse" />
                                    </div>
                                </div>
                                <div className="w-10 h-10 bg-white/5 rounded-xl animate-pulse" />
                            </div>
                            <div className="space-y-6">
                                <div className="h-10 w-full bg-white/5 rounded-2xl animate-pulse" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="h-24 bg-white/5 rounded-[24px] animate-pulse" />
                                    <div className="h-24 bg-white/5 rounded-[24px] animate-pulse" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && apis.length === 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-[32px] bg-white/[0.01]">
                    <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20">
                        <Activity className="w-10 h-10 text-blue-500 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2 tracking-tight">No Monitors Active</h3>
                    <p className="text-gray-500 mb-8 font-medium">Start watching your infrastructure by adding your first endpoint.</p>
                    <button onClick={() => setIsAdding(true)} className="premium-button flex items-center gap-3 px-8 text-lg">
                        <Plus className="w-6 h-6" /> Add Your First Monitor
                    </button>
                </motion.div>
            )}

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
                            <div className="relative z-10 flex gap-1.5 px-7 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                {tabs.map((tab) => {
                                    const isActive = activeTab === tab.id;
                                    const count = tab.id === 'assertions' ? newApi.assertions.length :
                                        tab.id === 'advanced' ? newApi.headers.length + newApi.queryParams.length : 0;
                                    return (
                                        <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
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
                                <div className="flex-1 overflow-y-auto px-7 py-6">
                                    <AnimatePresence mode="wait">

                                        {/* ── Basic Tab ────────────────────────── */}
                                        {activeTab === 'basic' && (
                                            <motion.div key="basic" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="space-y-5">
                                                <div>
                                                    <label className={LABEL}>Friendly Name</label>
                                                    <div className="relative">
                                                        <Activity className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                                        <input type="text" required placeholder="e.g. Payment Gateway API"
                                                            value={newApi.name}
                                                            onChange={(e) => setNewApi({ ...newApi, name: e.target.value })}
                                                            className={INPUT} style={{ paddingLeft: '2.5rem' }} suppressHydrationWarning />
                                                    </div>
                                                </div>
                                                <div>
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
                                                            className={SELECT}>
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
                                                    <div>
                                                        <label className={LABEL}>Check Interval</label>
                                                        <select value={newApi.interval} style={{ ...SELECT_ARROW }}
                                                            onChange={(e) => setNewApi({ ...newApi, interval: parseInt(e.target.value) })}
                                                            className={SELECT}>
                                                            <option value={1} className="bg-[#0d0d0d]">Every 1 Minute</option>
                                                            <option value={5} className="bg-[#0d0d0d]">Every 5 Minutes</option>
                                                            <option value={15} className="bg-[#0d0d0d]">Every 15 Minutes</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className={LABEL}>Alert Email</label>
                                                        <input type="email" placeholder="alerts@company.com"
                                                            value={newApi.alertEmail}
                                                            onChange={(e) => setNewApi({ ...newApi, alertEmail: e.target.value })}
                                                            className={INPUT} suppressHydrationWarning />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* ── Advanced Tab ─────────────────────── */}
                                        {activeTab === 'advanced' && (
                                            <motion.div key="advanced" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="space-y-7">
                                                <KVEditor label="Request Headers" pairs={newApi.headers}
                                                    onChange={(h) => setNewApi({ ...newApi, headers: h })} />
                                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
                                                <KVEditor label="Query Parameters" pairs={newApi.queryParams}
                                                    onChange={(q) => setNewApi({ ...newApi, queryParams: q })} />
                                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
                                                <div>
                                                    <label className={LABEL}>Request Body (JSON)</label>
                                                    <textarea rows={5} value={newApi.body}
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
                                                <div className="mb-5 p-4 rounded-2xl" style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)' }}>
                                                    <p className="text-xs text-violet-300 leading-relaxed">
                                                        <span className="font-black">Assertions</span> are rules evaluated on every ping. If any rule fails, the monitor is marked as <span className="font-bold text-amber-400">DEGRADED</span>.
                                                    </p>
                                                </div>
                                                <AssertionEditor assertions={newApi.assertions}
                                                    onChange={(a) => setNewApi({ ...newApi, assertions: a })} />
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
                                        {activeTab !== 'assertions' && (
                                            <button type="button"
                                                onClick={() => setActiveTab(activeTab === 'basic' ? 'advanced' : 'assertions')}
                                                className="px-5 py-2.5 rounded-xl font-bold text-sm text-blue-400 transition-all"
                                                style={{ border: '1px solid rgba(59,130,246,0.25)', background: 'rgba(59,130,246,0.06)' }}>
                                                Next →
                                            </button>
                                        )}
                                        <button type="submit" disabled={submitting}
                                            className="premium-button py-2.5 px-7 text-sm disabled:opacity-50">
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
