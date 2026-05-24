'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, RotateCcw, ArrowLeft, Trash2, Play, Pause, Clock, Server, RefreshCw, Pencil, X, Save, BellDot, MessageSquare, Webhook, Mail } from 'lucide-react';
import AlertChannelSelector from '@/components/alerts/AlertChannelSelector';
import ReactECharts from 'echarts-for-react';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { format, formatDistanceToNow } from 'date-fns';

export default function TcpDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { showToast } = useToast();

    const [data, setData] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const [rechecking, setRechecking] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [editTab, setEditTab] = useState<'basic' | 'notifications'>('basic');
    const [alertLogs, setAlertLogs] = useState<any[]>([]);
    const [loadingAlertLogs, setLoadingAlertLogs] = useState(false);

    const fetchData = async () => {
        try {
            const [mainRes, statsRes, logsRes] = await Promise.all([
                api.get(`/tcp/${id}`),
                api.get(`/tcp/${id}/stats`),
                api.get(`/tcp/${id}/logs?limit=50`)
            ]);
            setData(mainRes.data);
            setStats(statsRes.data);
            setLogs(logsRes.data);
        } catch (error) {
            console.error('Failed to fetch TCP details:', error);
            showToast('Failed to load TCP details', 'error');
            router.push('/dashboard/tcp');
        } finally {
            setLoading(false);
        }
    };

    const fetchAlertLogs = async () => {
        try {
            setLoadingAlertLogs(true);
            const { data } = await api.get(`/alert-channels/monitor/${id}`);
            setAlertLogs(data);
        } catch (error) {
            console.error('Failed to fetch alert logs', error);
        } finally {
            setLoadingAlertLogs(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetchAlertLogs();
        const interval = setInterval(() => {
            fetchData();
            fetchAlertLogs();
        }, 60000);
        return () => clearInterval(interval);
    }, [id]);

    const handleRecheck = async () => {
        setRechecking(true);
        try {
            await api.post(`/tcp/${id}/recheck`);
            showToast('Recheck initiated', 'success');
            setTimeout(fetchData, 2000);
        } catch (error) {
            showToast('Failed to trigger recheck', 'error');
        } finally {
            setRechecking(false);
        }
    };

    const handleTogglePause = async () => {
        try {
            await api.patch(`/tcp/${id}/toggle`);
            showToast(`Monitor ${data?.monitor?.isActive ? 'paused' : 'resumed'}`, 'success');
            fetchData();
        } catch (error) {
            showToast('Failed to toggle monitor', 'error');
        }
        setShowMenu(false);
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this monitor? All logs will be lost.')) return;
        try {
            await api.delete(`/tcp/${id}`);
            showToast('Monitor deleted', 'success');
            router.push('/dashboard/tcp');
        } catch (error) {
            showToast('Failed to delete monitor', 'error');
        }
    };
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.patch(`/tcp/${id}`, editForm);
            showToast('Changes saved successfully', 'success');
            setIsEditing(false);
            fetchData();
        } catch (err) {
            showToast('Failed to save changes', 'error');
        } finally {
            setSaving(false);
        }
    };

    const openEdit = () => {
        setEditForm({
            name: monitor.name,
            host: monitor.host,
            port: monitor.port,
            checkInterval: monitor.checkInterval,
            timeout: monitor.timeout,
            alertEmail: monitor.alertEmail,
            alertChannels: monitor.alertChannels || []
        });
        setEditTab('basic');
        setIsEditing(true);
    };

    if (loading) return <div className="p-10 text-white flex justify-center items-center h-screen">Loading...</div>;
    if (!data) return <div className="p-10 text-white">Not found</div>;

    const monitor = data.monitor;
    const isUp = monitor.status === 'up';
    const isPending = monitor.status === 'pending';

    const chartOptions = {
        grid: { top: 10, right: 10, bottom: 20, left: 40 },
        tooltip: { trigger: 'axis', backgroundColor: 'rgba(0,0,0,0.8)', textStyle: { color: '#fff' } },
        xAxis: {
            type: 'category',
            data: stats?.logs.map((l: any) => format(new Date(l.checkedAt), 'HH:mm')),
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
            axisLabel: { color: 'rgba(255,255,255,0.5)' }
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
            axisLabel: { color: 'rgba(255,255,255,0.5)' }
        },
        series: [{
            data: stats?.logs.map((l: any) => l.responseTime || 0),
            type: 'line',
            smooth: true,
            symbol: 'none',
            areaStyle: { color: 'rgba(249,115,22,0.1)' },
            lineStyle: { width: 2, color: '#f97316' },
        }]
    };

    return (
        <div className="p-10 max-w-7xl mx-auto">
            <button onClick={() => router.push('/dashboard/tcp')} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 font-bold text-sm">
                <ArrowLeft className="w-4 h-4" /> Back to TCP Monitors
            </button>

            <header className="flex justify-between items-start mb-10">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight mb-2 flex items-center gap-4">
                        {monitor.name}
                        {!monitor.isActive && <span className="bg-orange-500/10 text-orange-400 text-xs px-3 py-1 rounded-full uppercase tracking-widest border border-orange-500/20">PAUSED</span>}
                    </h1>
                    <p className="text-gray-500 font-mono flex items-center gap-2">
                        <Server className="w-4 h-4" /> {monitor.host}:{monitor.port}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleRecheck} disabled={rechecking} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-bold border border-white/10 transition-colors flex items-center gap-2 disabled:opacity-50">
                        <RefreshCw className={`w-4 h-4 ${rechecking ? 'animate-spin' : ''}`} /> Recheck Now
                    </button>

                    <button onClick={openEdit} className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-4 py-2 rounded-xl text-sm font-bold border border-blue-500/20 transition-colors flex items-center gap-2">
                        <Pencil className="w-4 h-4" /> Edit Monitor
                    </button>

                    <button onClick={handleTogglePause}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-200 border ${monitor.isActive
                            ? 'text-amber-500 border-amber-500/10 hover:bg-amber-500/10'
                            : 'text-emerald-500 border-emerald-500/10 hover:bg-emerald-500/10'
                            }`}>
                        {monitor.isActive ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Resume</>}
                    </button>

                    <button onClick={handleDelete}
                        className="flex items-center gap-2 text-red-500 hover:bg-red-500/10 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all border border-red-500/10">
                        <Trash2 className="w-4 h-4" /> Delete
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="glass-card p-6 border border-white/5">
                    <p className="text-[10px] font-black tracking-widest text-gray-500 mb-2 uppercase">Status</p>
                    <div className="flex items-center gap-2">
                        {isPending ? <RotateCcw className="w-8 h-8 text-gray-400 animate-spin" /> : isUp ? <ShieldCheck className="w-8 h-8 text-emerald-400" /> : <ShieldAlert className="w-8 h-8 text-red-400" />}
                        <span className={`text-2xl font-black ${isPending ? 'text-gray-400' : isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                            {monitor.status.toUpperCase()}
                        </span>
                    </div>
                </div>
                <div className="glass-card p-6 border border-white/5">
                    <p className="text-[10px] font-black tracking-widest text-gray-500 mb-2 uppercase">Uptime (24h)</p>
                    <p className="text-3xl font-black text-white">{data.uptime ? `${data.uptime}%` : '—'}</p>
                </div>
                <div className="glass-card p-6 border border-white/5">
                    <p className="text-[10px] font-black tracking-widest text-gray-500 mb-2 uppercase">Avg Response (24h)</p>
                    <p className="text-3xl font-black text-white">{data.avgResponseTime ? `${data.avgResponseTime}ms` : '—'}</p>
                </div>
                <div className="glass-card p-6 border border-white/5">
                    <p className="text-[10px] font-black tracking-widest text-gray-500 mb-2 uppercase">Interval</p>
                    <p className="text-3xl font-black text-white">{monitor.checkInterval}m</p>
                </div>
            </div>

            <div className="glass-card p-6 border border-white/5 mb-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Response Time (Last 24 Hours)
                </h3>
                <div className="h-[300px] w-full">
                    {stats?.logs?.length > 0 ? (
                        <ReactECharts option={chartOptions} style={{ height: '100%', width: '100%' }} theme="dark" />
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-500 text-sm font-bold">Not enough data to display chart.</div>
                    )}
                </div>
            </div>
            <div className="glass-card p-6 border border-white/5 mb-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                    <BellDot className="w-4 h-4 text-amber-500" /> Notification History
                </h3>
                <div className="glass-card border border-white/[0.05] overflow-hidden">
                    {loadingAlertLogs ? (
                        <div className="p-8 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                        </div>
                    ) : alertLogs.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-gray-500 italic font-medium">No notifications sent in the last 24 hours.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/[0.05]">
                            {alertLogs.map((log: any) => (
                                <div key={log._id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl ${
                                            log.status === 'sent' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                                        }`}>
                                            {log.alertChannelId?.type === 'slack' ? <MessageSquare className="w-5 h-5 text-[#4A154B]" /> :
                                             log.alertChannelId?.type === 'discord' ? <MessageSquare className="w-5 h-5 text-[#5865F2]" /> :
                                             log.alertChannelId?.type === 'teams' ? <MessageSquare className="w-5 h-5 text-[#6264A7]" /> :
                                             log.alertChannelId?.type === 'webhook' ? <Webhook className="w-5 h-5 text-gray-400" /> :
                                             <Mail className="w-5 h-5 text-blue-400" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-bold">{log.alertChannelId?.name || 'Email Alert'}</span>
                                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest ${
                                                    log.type === 'down' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                                                }`}>
                                                    {log.type.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-bold mt-1">
                                                {formatDistanceToNow(new Date(log.sentAt), { addSuffix: true })} • {format(new Date(log.sentAt), 'HH:mm:ss')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${
                                            log.status === 'sent' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                                        }`}>
                                            {log.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="glass-card p-6 border border-white/5 mb-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                    <BellDot className="w-4 h-4 text-amber-500" /> Notification History
                </h3>
                <div className="glass-card border border-white/[0.05] overflow-hidden">
                    {loadingAlertLogs ? (
                        <div className="p-8 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                        </div>
                    ) : alertLogs.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-gray-500 italic font-medium">No notifications sent in the last 24 hours.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/[0.05]">
                            {alertLogs.map((log: any) => (
                                <div key={log._id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl ${
                                            log.status === 'sent' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                                        }`}>
                                            {log.alertChannelId?.type === 'slack' ? <MessageSquare className="w-5 h-5 text-[#4A154B]" /> :
                                             log.alertChannelId?.type === 'discord' ? <MessageSquare className="w-5 h-5 text-[#5865F2]" /> :
                                             log.alertChannelId?.type === 'teams' ? <MessageSquare className="w-5 h-5 text-[#6264A7]" /> :
                                             log.alertChannelId?.type === 'webhook' ? <Webhook className="w-5 h-5 text-gray-400" /> :
                                             <Mail className="w-5 h-5 text-blue-400" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-bold">{log.alertChannelId?.name || 'Email Alert'}</span>
                                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest ${
                                                    log.type === 'down' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                                                }`}>
                                                    {log.type.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-bold mt-1">
                                                {formatDistanceToNow(new Date(log.sentAt), { addSuffix: true })} • {format(new Date(log.sentAt), 'HH:mm:ss')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${
                                            log.status === 'sent' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                                        }`}>
                                            {log.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="glass-card border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 font-mono">Recent Pings</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white/[0.01]">
                                <th className="p-4 pl-6 w-1/4">Time</th>
                                <th className="p-4 w-1/4">Status</th>
                                <th className="p-4 w-1/4">Response ms</th>
                                <th className="p-4 pr-6 w-1/4">Details</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-bold">
                            {logs.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No logs generated yet.</td></tr>
                            ) : logs.map((log: any) => (
                                <tr key={log._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4 pl-6 text-gray-400 truncate">{format(new Date(log.checkedAt), 'MMM d, HH:mm:ss')}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] uppercase tracking-widest ${log.status === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-300 font-mono">{log.responseTime ? `${log.responseTime}ms` : '—'}</td>
                                    <td className="p-4 pr-6 text-gray-500 font-mono text-xs truncate max-w-[200px]" title={log.reason || 'OK'}>{log.reason || 'OK'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: 'rgba(3,3,3,0.85)', backdropFilter: 'blur(8px)' }}>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-[#0c0c0e] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <Pencil className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white">Edit TCP Monitor</h3>
                                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Monitor Configuration</p>
                                </div>
                            </div>
                            <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-500 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex gap-4 px-6 pt-4">
                            <button onClick={() => setEditTab('basic')} className={`pb-2 text-sm font-bold transition-all border-b-2 ${editTab === 'basic' ? 'text-blue-400 border-blue-400' : 'text-gray-500 border-transparent'}`}>Basic Settings</button>
                            <button onClick={() => setEditTab('notifications')} className={`pb-2 text-sm font-bold transition-all border-b-2 ${editTab === 'notifications' ? 'text-blue-400 border-blue-400' : 'text-gray-500 border-transparent'}`}>Notifications</button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 overflow-y-auto">
                            {editTab === 'basic' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Friendly Name</label>
                                        <input type="text" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} 
                                            className="w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.09] text-white text-sm outline-none focus:border-blue-500/50 transition-all" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Host</label>
                                            <input type="text" required value={editForm.host} onChange={e => setEditForm({ ...editForm, host: e.target.value })} 
                                                className="w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.09] text-white text-sm outline-none focus:border-blue-500/50 transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Port</label>
                                            <input type="number" required value={editForm.port} onChange={e => setEditForm({ ...editForm, port: parseInt(e.target.value) })} 
                                                className="w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.09] text-white text-sm outline-none focus:border-blue-500/50 transition-all" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Interval (min)</label>
                                            <input type="number" required value={editForm.checkInterval} onChange={e => setEditForm({ ...editForm, checkInterval: parseInt(e.target.value) })} 
                                                className="w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.09] text-white text-sm outline-none focus:border-blue-500/50 transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Timeout (ms)</label>
                                            <input type="number" required value={editForm.timeout} onChange={e => setEditForm({ ...editForm, timeout: parseInt(e.target.value) })} 
                                                className="w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.09] text-white text-sm outline-none focus:border-blue-500/50 transition-all" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Alert Email</label>
                                        <input type="email" value={editForm.alertEmail} onChange={e => setEditForm({ ...editForm, alertEmail: e.target.value })} 
                                            className="w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.09] text-white text-sm outline-none focus:border-blue-500/50 transition-all" placeholder="alerts@company.com" />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                        <p className="text-[11px] text-blue-300 leading-relaxed font-medium">Assign multi-channel alerts to receiving notifications on Slack, Discord, or Webhooks when this port goes down.</p>
                                    </div>
                                    <AlertChannelSelector 
                                        selectedChannels={editForm.alertChannels}
                                        onChange={ids => setEditForm({ ...editForm, alertChannels: ids })}
                                    />
                                </div>
                            )}

                            <div className="mt-8 flex gap-3">
                                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 rounded-[14px] bg-white/5 text-white text-sm font-bold border border-white/10 hover:bg-white/10 transition-all">Cancel</button>
                                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-[14px] bg-blue-600 text-white text-sm font-black border border-blue-500/50 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50">
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
