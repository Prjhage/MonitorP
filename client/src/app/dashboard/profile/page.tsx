'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Settings as SettingsIcon, Shield, Share2, Mail, ExternalLink, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPublicUrl(`${window.location.origin}/status/${encodeURIComponent(user?.companyName || '')}`);
    }
  }, [user]);

  const handleCopy = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <header className="mb-10">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-500" /> My Profile
        </h2>
        <p className="text-gray-500">Manage your personal information and public status page</p>
      </header>

      <div className="space-y-8">
        {/* Profile Card */}
        <div className="glass-card p-8">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" /> Profile Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
              <div className="text-white font-medium bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                {user?.fullName}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Company Name</label>
              <div className="text-white font-medium bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                {user?.companyName}
              </div>
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
              <div className="text-white font-medium bg-white/5 px-4 py-3 rounded-xl border border-white/5 flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-500" /> {user?.email}
              </div>
            </div>
          </div>
        </div>

        {/* Public Page Card */}
        <div className="glass-card p-8 border-blue-500/20 bg-blue-500/[0.02]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-500" /> Public Status Page
              </h3>
              <p className="text-gray-400 text-sm">Build trust with your clients by sharing a live status link.</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
              Enabled
            </div>
          </div>

          <div className="relative group">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Your Unique Status URL</label>
            <div className="flex gap-3">
              <div className="flex-1 text-blue-400 font-mono text-sm bg-blue-500/5 px-4 py-3 rounded-xl border border-blue-500/10 truncate">
                {publicUrl}
              </div>
              <button
                onClick={handleCopy}
                className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all flex items-center justify-center min-w-[50px]"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </button>
              <a
                href={publicUrl}
                target="_blank"
                className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all flex items-center justify-center min-w-[50px]"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Alerts Card */}
        <div className="glass-card p-8">
          <h3 className="text-xl font-bold text-white mb-6">Notification Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <div>
                <div className="text-white font-medium">Email Alerts</div>
                <div className="text-xs text-gray-500">Receive instant alerts when a service goes down</div>
              </div>
              <div className="w-12 h-6 bg-blue-600 rounded-full flex items-center px-1">
                <div className="w-4 h-4 bg-white rounded-full ml-auto" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 opacity-50">
              <div>
                <div className="text-white font-medium">Monthly Reports</div>
                <div className="text-xs text-gray-500">Get a summary of your uptime at the end of each month</div>
              </div>
              <div className="w-12 h-6 bg-gray-700 rounded-full flex items-center px-1">
                <div className="w-4 h-4 bg-gray-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
