'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCache } from '@/context/CacheContext';
import ApiCard from '@/components/dashboard/ApiCard';
import {
    Plus, Search, Activity, ShieldCheck, X, BellDot,
    Settings2, Code2, CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useAuth } from '@/context/AuthContext';
import AlertChannelSelector from '@/components/alerts/AlertChannelSelector';

// ─── Shared Styles ────────────────────────────────────────────────────────────
const INPUT = 'w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.09] text-white text-sm outline-none transition-all duration-200 placeholder-white/20 focus:bg-white/[0.06] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15';
const SELECT = 'w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.09] text-white text-sm outline-none transition-all duration-200 focus:bg-white/[0.06] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 appearance-none pr-9 cursor-pointer';
const LABEL = 'block text-[10px] font-black uppercase tracking-[0.12em] text-gray-400 mb-1.5 ml-0.5';
const TEXTAREA = 'w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.09] text-white text-sm outline-none transition-all duration-200 placeholder-white/20 focus:bg-white/[0.06] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 font-mono resize-none leading-relaxed';

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

// ─── Components ───────────────────────────────────────────────────────────────
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
            <div className="space-y-2">
                {pairs.map((pair, i) => (
                    <div key={i} className="flex gap-2">
                        <input value={pair.key} onChange={(e) => update(i, 'key', e.target.value)}
                            placeholder="Key" className={INPUT + ' flex-1'} />
                        <input value={pair.value} onChange={(e) => update(i, 'value', e.target.value)}
                            placeholder="Value" className={INPUT + ' flex-1'} />
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
            <div className="space-y-3">
                {assertions.map((a, i) => (
                    <div key={i} className="p-4 bg-white/[0.02] border border-white/[0.07] rounded-2xl space-y-2.5">
                        <div className="flex gap-2">
                            <select value={a.type} onChange={(e) => update(i, 'type', e.target.value)}
                                className={SELECT} style={SELECT_ARROW}>
                                {ASSERTION_TYPES.map(t => <option key={t.value} value={t.value} className="bg-[#0d0d0d]">{t.label}</option>)}
                            </select>
                            <select value={a.operator} onChange={(e) => update(i, 'operator', e.target.value)}
                                className={SELECT} style={SELECT_ARROW}>
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
                                    placeholder="JSON path" className={INPUT + ' flex-1'} />
                            )}
                            <input value={a.value} onChange={(e) => update(i, 'value', e.target.value)}
                                placeholder="Expected value" className={INPUT + ' flex-1'} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ApiMonitoringPage() {
    const { apis, loading, addApi, toggleApi, deleteApi } = useCache();
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
        } catch (err) { showToast('Failed to toggle monitor', 'error'); }
    };

    const handleDelete = (id: string, name: string) => {
        askConfirm({
            title: 'Delete Monitor',
            message: `Are you sure you want to delete "${name}"?`,
            confirmText: 'Delete',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await deleteApi(id);
                    showToast('Monitor deleted', 'success');
                } catch (err) { showToast('Failed to delete', 'error'); }
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
        } catch (err) { console.error(err); }
        finally { setSubmitting(false); }
    };

    return (
        <div className="p-10 max-w-7xl mx-auto">
            <header className="flex justify-between items-center mb-12">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tight">
                        API <span className="text-blue-500">Monitoring</span>
                    </h2>
                    <p className="text-gray-500 font-medium mt-1">Manage and track your REST API endpoints globally.</p>
                </div>
                {isAtLeast('admin') && (
                    <button onClick={() => setIsAdding(true)} className="premium-button btn-glow-blue flex items-center gap-2">
                        <Plus className="w-5 h-5" /> New API Monitor
                    </button>
                )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    [1,2,3].map(i => <div key={i} className="h-64 bg-white/5 rounded-3xl animate-pulse" />)
                ) : apis.map(a => (
                    <ApiCard 
                        key={a._id} api={a} 
                        onClick={() => router.push(`/dashboard/${a._id}`)}
                        onTogglePause={(e) => { e.stopPropagation(); handleTogglePause(a._id, a.isActive); }}
                        onDelete={(e) => { e.stopPropagation(); handleDelete(a._id, a.name); }}
                    />
                ))}
            </div>

            {/* Add API Modal (Simplified import from dashboard/page) */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-2xl glass-card flex flex-col max-h-[90vh]">
                            {/* Modal Header */}
                            <div className="p-7 border-b border-white/10 flex justify-between items-center">
                                <h3 className="text-xl font-black text-white">Add New API Monitor</h3>
                                <button onClick={() => setIsAdding(false)}><X className="w-6 h-6 text-gray-500" /></button>
                            </div>
                            
                            {/* Tabs */}
                            <div className="flex gap-2 p-4 border-b border-white/5">
                                {['basic', 'advanced', 'assertions', 'notifications'].map((t) => (
                                    <button key={t} onClick={() => setActiveTab(t as ModalTab)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest ${activeTab === t ? 'bg-blue-500 text-white' : 'text-gray-500'}`}>
                                        {t}
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleAddApi} className="flex-1 overflow-y-auto p-8 space-y-6">
                                {activeTab === 'basic' && (
                                    <div className="space-y-4">
                                        <div><label className={LABEL}>Name</label><input required className={INPUT} value={newApi.name} onChange={e => setNewApi({...newApi, name: e.target.value})} /></div>
                                        <div><label className={LABEL}>URL</label><input required type="url" className={INPUT} value={newApi.url} onChange={e => setNewApi({...newApi, url: e.target.value})} /></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><label className={LABEL}>Method</label><select className={SELECT} style={SELECT_ARROW} value={newApi.method} onChange={e => setNewApi({...newApi, method: e.target.value})}>
                                                {['GET', 'POST', 'PUT', 'DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
                                            </select></div>
                                            <div><label className={LABEL}>Interval</label><select className={SELECT} style={SELECT_ARROW} value={newApi.interval} onChange={e => setNewApi({...newApi, interval: parseInt(e.target.value)})}>
                                                <option value={60}>1 Minute</option>
                                                <option value={300}>5 Minutes</option>
                                            </select></div>
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'advanced' && <KVEditor label="Headers" pairs={newApi.headers} onChange={h => setNewApi({...newApi, headers: h})} />}
                                {activeTab === 'assertions' && <AssertionEditor assertions={newApi.assertions} onChange={a => setNewApi({...newApi, assertions: a})} />}
                                {activeTab === 'notifications' && (
                                    <div className="space-y-4">
                                        <label className={LABEL}>Alert Channels</label>
                                        <AlertChannelSelector selectedChannels={newApi.alertChannels} onChange={ids => setNewApi({...newApi, alertChannels: ids})} />
                                    </div>
                                )}
                                
                                <div className="pt-6 border-t border-white/10 flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-500">Cancel</button>
                                    <button type="submit" disabled={submitting} className="premium-button px-8 py-2.5">{submitting ? 'Saving...' : 'Start Monitoring'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
