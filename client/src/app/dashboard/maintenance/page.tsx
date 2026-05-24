'use client';

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { 
  Wrench, Calendar, Clock, Plus, Trash2, X, 
  CheckCircle2, AlertCircle, Loader2, Globe,
  LayoutDashboard, Heart, Lock, Server, Timer, Power, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useAuth } from '@/context/AuthContext';
import { useCache } from '@/context/CacheContext';

const INPUT = 'w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.09] text-white text-sm outline-none transition-all duration-200 focus:bg-white/[0.06] focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/15';
const LABEL = 'block text-[10px] font-black uppercase tracking-[0.12em] text-gray-400 mb-1.5 ml-0.5';

export default function MaintenancePage() {
  const { isAtLeast } = useAuth();
  const { refreshAll } = useCache();
  const [windows, setWindows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const { showToast } = useToast();
  const { confirm: askConfirm } = useConfirm();

  const [form, setForm] = useState({
    name: '',
    startTime: '',
    endTime: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    affectedMonitors: 'all'
  });

  const fetchData = async () => {
    try {
      const { data } = await api.get('/maintenance');
      setWindows(data);
    } catch (err) {
      showToast('Failed to load maintenance windows', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(form.startTime) >= new Date(form.endTime)) {
      return showToast('End time must be after start time', 'error');
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/maintenance', form);
      setWindows(prev => [data, ...prev]);
      setIsAdding(false);
      setForm({
        name: '',
        startTime: '',
        endTime: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        affectedMonitors: 'all'
      });
      showToast('Maintenance window scheduled', 'success');
      refreshAll(); // Force dashboard refresh
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to create window', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    askConfirm({
      title: 'Cancel Maintenance',
      message: `Are you sure you want to cancel "${name}"? Alerts will resume immediately.`,
      confirmText: 'Cancel Window',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/maintenance/${id}`);
          setWindows(prev => prev.filter(w => w._id !== id));
          showToast('Maintenance window removed', 'success');
          refreshAll(); // Force dashboard refresh
        } catch (err) {
          showToast('Failed to remove window', 'error');
        }
      },
    });
  };

  const getStatus = (start: string, end: string) => {
    const now = new Date();
    const startTime = new Date(start);
    const endTime = new Date(end);

    if (now > endTime) return 'finished';
    if (now >= startTime && now <= endTime) return 'active';
    return 'scheduled';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 max-w-6xl mx-auto">
      
      {/* Header */}
      <header className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">
            Maintenance <span className="text-amber-400">Windows</span>
          </h2>
          <p className="text-gray-500 font-medium mt-2">
            Schedule downtime to suppress alerts during system updates.
          </p>
        </div>
        
        {isAtLeast('admin') && (
          <button 
            onClick={() => setIsAdding(true)}
            className="premium-button flex items-center gap-2 px-6 py-2.5"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            <Plus className="w-4 h-4" /> Schedule Window
          </button>
        )}
      </header>

      {/* Info Box */}
      <div className="bg-amber-500/5 border border-amber-500/10 rounded-[24px] p-6 mb-12 flex gap-5 items-start">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
          <Info className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h4 className="text-amber-500 font-black text-sm uppercase tracking-wider mb-1">How it works</h4>
          <p className="text-gray-400 text-sm leading-relaxed max-w-3xl">
            During an active maintenance window, PingForge will continue checking your monitors but will 
            <span className="text-white font-bold"> suppress all alert notifications</span> (Email, Slack, Discord, etc.). 
            This prevents false positives during scheduled updates or deployments.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[200px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Loading windows...</p>
          </div>
        ) : windows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
            <div className="w-16 h-16 rounded-full bg-amber-500/5 flex items-center justify-center mb-6 border border-amber-500/10">
              <Calendar className="w-8 h-8 text-amber-500/40" />
            </div>
            <h3 className="text-xl font-black text-white mb-2 tracking-tight">No Maintenance Scheduled</h3>
            <p className="text-gray-500 mb-8 max-w-xs text-center font-medium">
              Create a window to prevent alerts during your next scheduled update.
            </p>
            {isAtLeast('admin') && (
              <button onClick={() => setIsAdding(true)} className="text-amber-400 font-black text-sm uppercase tracking-widest hover:text-amber-300 transition-colors">
                + Schedule First Window
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {windows.map((w) => {
              const status = getStatus(w.startTime, w.endTime);
              return (
                <motion.div 
                  layout
                  key={w._id} 
                  className={`glass-card p-8 relative overflow-hidden transition-all duration-300 ${
                    status === 'active' ? 'border-amber-500/30 bg-amber-500/[0.03]' : ''
                  }`}
                >
                  {status === 'active' && (
                    <div className="absolute top-0 right-0 px-4 py-1.5 bg-amber-500 text-black font-black text-[10px] uppercase tracking-widest rounded-bl-xl shadow-lg">
                      Live Now
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                        status === 'finished' ? 'bg-gray-500/5 border-gray-500/10' :
                        status === 'active' ? 'bg-amber-500/10 border-amber-500/20' :
                        'bg-blue-500/10 border-blue-500/20'
                      }`}>
                        <Wrench className={`w-6 h-6 ${
                          status === 'finished' ? 'text-gray-500' :
                          status === 'active' ? 'text-amber-500' :
                          'text-blue-500'
                        }`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">{w.name}</h3>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 mt-1">
                          <Globe className="w-3 h-3" /> {w.timezone}
                        </p>
                      </div>
                    </div>
                    {isAtLeast('admin') && (
                      <button 
                        onClick={() => handleDelete(w._id, w.name)}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-4 text-sm font-medium">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
                        <Timer className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-0.5">Start</div>
                        <div className="text-white">{new Date(w.startTime).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-medium">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
                        <Power className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-0.5">End</div>
                        <div className="text-white">{new Date(w.endTime).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-5 border-t border-white/5">
                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <LayoutDashboard className="w-3 h-3" /> {w.affectedMonitors === 'all' ? 'All Monitors' : 'Specific Monitors'}
                    </div>
                    {status === 'active' ? (
                      <div className="ml-auto flex items-center gap-2 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                        In Progress
                      </div>
                    ) : status === 'finished' ? (
                      <div className="ml-auto text-gray-600 text-[10px] font-black uppercase tracking-widest">
                        Completed
                      </div>
                    ) : (
                      <div className="ml-auto text-blue-400 text-[10px] font-black uppercase tracking-widest">
                        Upcoming
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg glass-card p-8 border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <Calendar className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">Schedule Maintenance</h3>
                    <p className="text-xs text-gray-500 mt-1">Silence alerts for a specific time period</p>
                  </div>
                </div>
                <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-6">
                <div>
                  <label className={LABEL}>Window Name</label>
                  <input 
                    type="text" required placeholder="e.g. Database Migration"
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className={INPUT}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Start Time</label>
                    <input 
                      type="datetime-local" required
                      value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})}
                      className={INPUT}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>End Time</label>
                    <input 
                      type="datetime-local" required
                      value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})}
                      className={INPUT}
                    />
                  </div>
                </div>

                <div>
                  <label className={LABEL}>Timezone</label>
                  <select 
                    value={form.timezone} onChange={e => setForm({...form, timezone: e.target.value})}
                    className={INPUT}
                  >
                    {/* Simplified for now, in real apps we'd use a full timezone list */}
                    <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>Local ({Intl.DateTimeFormat().resolvedOptions().timeZone})</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>

                <div>
                  <label className={LABEL}>Affected Monitors</label>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      className={`flex-1 py-3.5 rounded-xl font-bold text-xs transition-all ${
                        form.affectedMonitors === 'all' 
                          ? 'bg-amber-500/10 border border-amber-500/40 text-amber-400' 
                          : 'bg-white/5 border border-white/10 text-gray-500'
                      }`}
                      onClick={() => setForm({...form, affectedMonitors: 'all'})}
                    >
                      All Monitors
                    </button>
                    <button 
                      type="button"
                      disabled
                      className="flex-1 py-3.5 rounded-xl font-bold text-xs bg-white/5 border border-white/10 text-gray-700 cursor-not-allowed"
                    >
                      Selective (Coming Soon)
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" onClick={() => setIsAdding(false)}
                    className="flex-1 py-3.5 rounded-xl font-bold text-sm text-gray-400 hover:text-white transition-all bg-white/5 border border-white/10"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" disabled={submitting}
                    className="flex-1 py-3.5 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 8px 24px rgba(217,119,6,0.3)' }}
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Schedule'}
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
