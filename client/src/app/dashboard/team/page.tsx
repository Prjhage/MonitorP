'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { 
  Users, UserPlus, Mail, Shield, ShieldCheck, 
  Trash2, Search, X, Loader2, Send, 
  CheckCircle2, Clock, MoreVertical, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useAuth, UserRole } from '@/context/AuthContext';

const INPUT = 'w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.09] text-white text-sm outline-none transition-all duration-200 placeholder-white/20 focus:bg-white/[0.06] focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15';
const LABEL = 'block text-[10px] font-black uppercase tracking-[0.12em] text-gray-400 mb-1.5 ml-0.5';

const ROLE_COLORS: Record<string, string> = {
  owner: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  admin: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  member: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  viewer: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  owner: 'Full access, billing, and team management',
  admin: 'Manage monitors and team members',
  member: 'Internal team access with full visibility',
  viewer: 'Restricted read-only observer access',
};

export default function TeamPage() {
  const { user, isAtLeast } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [search, setSearch] = useState('');
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'member' as UserRole });
  const [submitting, setSubmitting] = useState(false);
  
  const { showToast } = useToast();
  const { confirm: askConfirm } = useConfirm();

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 25, stiffness: 100 } } };

  const fetchData = async () => {
    try {
      const [membersRes, orgRes] = await Promise.all([
        api.get('/team'),
        api.get('/team/org')
      ]);
      setMembers(membersRes.data);
      setOrg(orgRes.data);
    } catch (err) {
      console.error('Failed to fetch team data', err);
      showToast('Failed to load team data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post('/team/invite', inviteForm);
      setMembers(prev => [...prev, data]);
      setIsInviting(false);
      setInviteForm({ email: '', role: 'member' });
      showToast(`Invitation sent to ${inviteForm.email}`, 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to send invitation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = (memberId: string, email: string) => {
    askConfirm({
      title: 'Remove Team Member',
      message: `Are you sure you want to remove ${email} from the team? They will lose all access immediately.`,
      confirmText: 'Remove Member',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/team/${memberId}`);
          setMembers(prev => prev.filter(m => m._id !== memberId));
          showToast('Member removed successfully', 'success');
        } catch (err) {
          showToast('Failed to remove member', 'error');
        }
      },
    });
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const { data } = await api.patch(`/team/${memberId}/role`, { role: newRole });
      setMembers(prev => prev.map(m => m._id === memberId ? data : m));
      showToast('Role updated successfully', 'success');
    } catch (err) {
      showToast('Failed to update role', 'error');
    }
  };

  const handleResendInvite = async (memberId: string) => {
    try {
      await api.post(`/team/${memberId}/resend`);
      showToast('Invitation email resent', 'success');
    } catch (err) {
      showToast('Failed to resend invitation', 'error');
    }
  };

  const filteredMembers = members.filter(m => 
    m.inviteEmail.toLowerCase().includes(search.toLowerCase()) ||
    m.userId?.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = members.filter(m => m.isAccepted).length;
  const pendingCount = members.filter(m => !m.isAccepted).length;

  if (!isAtLeast('member')) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-6 opacity-20" />
        <h2 className="text-2xl font-black text-white mb-2">Restricted Access</h2>
        <p className="text-gray-500 max-w-sm text-center">Viewer roles are restricted from accessing internal team management. Please contact your administrator for elevated access.</p>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="p-10 max-w-7xl mx-auto">
      
      {/* Header */}
      <motion.header variants={itemVariants} className="flex justify-between items-end mb-12">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
              Enterprise
            </div>
            {org && (
              <span className="text-gray-500 font-bold text-sm">/ {org.name}</span>
            )}
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">
            Team <span className="text-indigo-400">Management</span>
          </h2>
          <p className="text-gray-500 font-medium mt-2">
            Manage your organization's members and their access levels.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Filter members..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="premium-input pl-12 pr-4 py-2.5 w-64" 
            />
          </div>
          {isAtLeast('admin') && (
            <button 
              onClick={() => setIsInviting(true)}
              className="premium-button flex items-center gap-2 px-6 py-2.5"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
            >
              <UserPlus className="w-4 h-4" /> Invite Member
            </button>
          )}
        </div>
      </motion.header>

      {/* Stats Summary */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="glass-card p-6 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Users className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{members.length}</div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Members</div>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{activeCount}</div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Users</div>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <Clock className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{pendingCount}</div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pending Invites</div>
          </div>
        </div>
      </motion.div>

      {/* Members List */}
      <motion.div variants={itemVariants} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Member</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Role</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Joined</th>
                <th className="px-8 py-5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Loading team members...</p>
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <p className="text-gray-500 font-medium">No members found matching your search.</p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member._id} className="group hover:bg-white/[0.01] transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 text-indigo-400 font-black text-sm">
                          {member.isAccepted ? member.userId?.fullName?.charAt(0) : '?'}
                        </div>
                        <div>
                          <div className="text-white font-bold text-sm">
                            {member.isAccepted ? member.userId?.fullName : 'Pending Invitation'}
                          </div>
                          <div className="text-gray-500 text-xs mt-0.5">{member.inviteEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${ROLE_COLORS[member.role]}`}>
                          {member.role}
                        </span>
                        {member.role === 'owner' && <ShieldCheck className="w-4 h-4 text-purple-400" />}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {member.isAccepted ? (
                        <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                          Active
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-400 text-[10px] font-black uppercase tracking-widest">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                          Pending
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 text-sm text-gray-500 font-medium">
                      {member.isAccepted 
                        ? new Date(member.acceptedAt).toLocaleDateString()
                        : new Date(member.invitedAt).toLocaleDateString()
                      }
                    </td>
                    <td className="px-8 py-6 text-right">
                      {isAtLeast('admin') && member.role !== 'owner' && (
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!member.isAccepted && (
                            <button 
                              onClick={() => handleResendInvite(member._id)}
                              className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                              title="Resend Invitation"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          {user?.role === 'owner' && (
                            <div className="relative group/role">
                              <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                                <Shield className="w-4 h-4" />
                              </button>
                              <div className="absolute right-0 bottom-full mb-2 w-48 bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden hidden group-role-hover:block z-20">
                                {['admin', 'member', 'viewer'].map(r => (
                                  <button
                                    key={r}
                                    onClick={() => handleUpdateRole(member._id, r)}
                                    className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors hover:bg-white/5 ${member.role === r ? 'text-indigo-400 bg-indigo-500/5' : 'text-gray-400'}`}
                                  >
                                    Set as {r.charAt(0).toUpperCase() + r.slice(1)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          <button 
                            onClick={() => handleRemove(member._id, member.inviteEmail)}
                            className="p-2 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Invite Modal */}
      <AnimatePresence>
        {isInviting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md glass-card p-8 border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <UserPlus className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">Invite Member</h3>
                    <p className="text-xs text-gray-500 mt-1">Add a new person to your team</p>
                  </div>
                </div>
                <button onClick={() => setIsInviting(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleInvite} className="space-y-6">
                <div>
                  <label className={LABEL}>Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="email" 
                      required 
                      placeholder="teammate@company.com"
                      value={inviteForm.email}
                      onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                      className={INPUT + " pl-12"}
                    />
                  </div>
                </div>

                <div>
                  <label className={LABEL}>Access Role</label>
                  <div className="grid grid-cols-1 gap-3">
                    {(['admin', 'member', 'viewer'] as UserRole[]).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setInviteForm({ ...inviteForm, role: r })}
                        className={`text-left p-4 rounded-2xl border transition-all duration-300 ${
                          inviteForm.role === r 
                            ? 'bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.1)]' 
                            : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${
                            inviteForm.role === r ? 'text-indigo-400' : 'text-gray-400'
                          }`}>
                            {r}
                          </span>
                          {inviteForm.role === r && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                        </div>
                        <p className="text-xs text-gray-500 font-medium">{ROLE_DESCRIPTIONS[r]}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsInviting(false)}
                    className="flex-1 py-3.5 rounded-xl font-bold text-sm text-gray-400 hover:text-white transition-all bg-white/5 border border-white/10"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3.5 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 8px 24px rgba(79,70,229,0.3)' }}
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Invite'}
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
