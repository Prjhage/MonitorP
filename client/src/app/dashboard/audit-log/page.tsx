'use client';

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { 
  ClipboardList, Search, Filter, Calendar, 
  User, Download, ChevronRight, Activity,
  Globe, Shield, Key, Mail, Wrench, Loader2,
  FileJson, ArrowUpDown, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

const ACTION_COLORS: Record<string, string> = {
  created: 'text-emerald-400 bg-emerald-500/10',
  updated: 'text-blue-400 bg-blue-500/10',
  deleted: 'text-red-400 bg-red-500/10',
  paused: 'text-amber-400 bg-amber-500/10',
  resumed: 'text-indigo-400 bg-indigo-500/10',
  invited: 'text-purple-400 bg-purple-500/10',
  removed: 'text-orange-400 bg-orange-500/10',
  role_changed: 'text-pink-400 bg-pink-500/10',
  subscribed: 'text-teal-400 bg-teal-500/10',
  login: 'text-cyan-400 bg-cyan-500/10',
};

const RESOURCE_ICONS: Record<string, any> = {
  api: Activity,
  ssl: Shield,
  tcp: Globe,
  dns: Globe,
  heartbeat: History,
  domain: Globe,
  apikey: Key,
  alertchannel: Mail,
  team: User,
  maintenance: Wrench,
  subscriber: User,
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [exporting, setExporting] = useState(false);
  
  const { showToast } = useToast();

  const fetchLogs = async () => {
    try {
      const { data } = await api.get('/audit-log');
      // The API returns { logs: [], total: 0, ... }
      setLogs(data.logs || []);
    } catch (err) {
      showToast('Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      // In a real app, this would hit /api/audit-log/export and download a CSV
      // For now, we'll simulate the download
      const headers = ['Timestamp', 'User', 'Action', 'Resource', 'Details'];
      const rows = logs.map(l => [
        new Date(l.timestamp).toLocaleString(),
        l.userEmail,
        l.action,
        `${l.resourceType}: ${l.resourceName}`,
        JSON.stringify(l.changes || {})
      ]);
      
      const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `audit_log_${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('Audit log exported to CSV', 'success');
    } catch (err) {
      showToast('Failed to export logs', 'error');
    } finally {
      setExporting(false);
    }
  };

  const filteredLogs = logs.filter(l => {
    const matchesSearch = l.userEmail.toLowerCase().includes(search.toLowerCase()) || 
                          l.resourceName.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || l.resourceType === filterType;
    const matchesAction = filterAction === 'all' || l.action === filterAction;
    return matchesSearch && matchesType && matchesAction;
  });

  const resourceTypes = Array.from(new Set(logs.map(l => l.resourceType)));
  const actions = Array.from(new Set(logs.map(l => l.action)));

  const { isAtLeast } = useAuth();

  if (!isAtLeast('member')) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <Shield className="w-16 h-16 text-red-500 mb-6 opacity-20" />
        <h2 className="text-2xl font-black text-white mb-2">Restricted Access</h2>
        <p className="text-gray-500 max-w-sm text-center">Viewer roles are restricted from accessing the organization audit log.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 max-w-7xl mx-auto">
      
      {/* Header */}
      <header className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">
            Audit <span className="text-blue-400">Log</span>
          </h2>
          <p className="text-gray-500 font-medium mt-2">
            A comprehensive history of all administrative actions in your organization.
          </p>
        </div>
        
        <button 
          onClick={handleExport}
          disabled={exporting}
          className="premium-button flex items-center gap-2 px-6 py-2.5"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export CSV
        </button>
      </header>

      {/* Filters Strip */}
      <div className="glass-card p-4 mb-8 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[300px] relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 group-focus-within:text-blue-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by user email or resource name..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="premium-input pl-12 pr-4 py-2.5 w-full" 
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <select 
              value={filterType} 
              onChange={e => setFilterType(e.target.value)}
              className="premium-input pl-10 pr-4 py-2 text-xs font-bold bg-white/[0.02]"
            >
              <option value="all">All Resources</option>
              {resourceTypes.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          </div>
          
          <div className="relative">
            <Activity className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <select 
              value={filterAction} 
              onChange={e => setFilterAction(e.target.value)}
              className="premium-input pl-10 pr-4 py-2 text-xs font-bold bg-white/[0.02]"
            >
              <option value="all">All Actions</option>
              {actions.map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Time</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">User</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Action</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Resource</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Fetching history logs...</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <p className="text-gray-500 font-medium">No audit entries found.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const Icon = RESOURCE_ICONS[log.resourceType] || Activity;
                  return (
                    <tr key={log._id} className="group hover:bg-white/[0.01] transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-white font-bold text-sm">{new Date(log.timestamp).toLocaleDateString()}</span>
                          <span className="text-gray-500 text-[10px] font-medium">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-white font-bold text-sm">{log.userFullName}</span>
                            <span className="text-gray-500 text-[10px]">{log.userEmail}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/5 ${ACTION_COLORS[log.action]}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/5 border border-blue-500/10 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-blue-400/60" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-white font-bold text-sm">{log.resourceName}</span>
                            <span className="text-gray-500 text-[10px] uppercase tracking-tighter">{log.resourceType}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        {log.changes && log.changes.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {log.changes.map((c: any, i: number) => (
                              <div key={i} className="px-2 py-1 rounded bg-white/5 border border-white/5 text-[9px] font-medium text-gray-400">
                                <span className="text-blue-400/80">{c.field}</span>: {String(c.oldValue)} → <span className="text-white">{String(c.newValue)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </motion.div>
  );
}
