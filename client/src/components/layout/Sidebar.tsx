'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, Activity, ShieldCheck, Home, Heart, Sparkles, Lock, Server, Globe, Calendar, LogOut,
  Users, Wrench, ClipboardList, ChevronDown, ChevronRight, Bell
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationCenter from '@/components/dashboard/NotificationCenter';
import api from '@/services/api';

export default function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen?: boolean; setMobileOpen?: (open: boolean) => void }) {
  const { user, logout, isAtLeast } = useAuth();
  const pathname = usePathname();
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [expandedSections, setExpandedSections] = React.useState<string[]>(['overview', 'monitoring']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnreadCount(data.count);
    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  };

  React.useEffect(() => {
    fetchUnreadCount();
    // Poll every 60 seconds
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const overviewItems = [
    { name: 'Home', icon: Home, path: '/' },
    { name: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Incidents Log', icon: Activity, path: '/dashboard/incidents' },
  ];

  const monitoringItems = [
    { name: 'API Monitors', icon: Sparkles, path: '/dashboard/api' }, // Changed path from /dashboard to /dashboard/api for clarity if possible, but /dashboard is main. Wait.
    { name: 'Heartbeats', icon: Heart, path: '/dashboard/heartbeats' },
    { name: 'SSL Certificates', icon: Lock, path: '/dashboard/ssl' },
    { name: 'TCP Ports', icon: Server, path: '/dashboard/tcp' },
    { name: 'DNS Records', icon: Globe, path: '/dashboard/dns' },
    { name: 'Domain Expiry', icon: Calendar, path: '/dashboard/domains' },
  ];

  const workspaceItems = [
    { name: 'Team Members', icon: Users, path: '/dashboard/team' },
    { name: 'Alert Channels', icon: Bell, path: '/dashboard/alert-channels' },
    { name: 'Maintenance', icon: Wrench, path: '/dashboard/maintenance' },
    { name: 'Audit Log', icon: ClipboardList, path: '/dashboard/audit-log' },
  ];



  return (
    <>
    {/* Mobile Overlay */}
    {mobileOpen && (
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        onClick={() => setMobileOpen?.(false)}
      />
    )}

    <aside className={`w-72 border-r border-white/[0.04] flex flex-col p-6 h-screen bg-[#0a0a0a]/90 backdrop-blur-3xl z-50 overflow-hidden fixed top-0 left-0 transition-transform duration-300 md:translate-x-0 md:sticky md:top-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Decorative Glows */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* Brand Header */}
      <div className="flex items-center justify-between mb-14 mt-4 relative z-10">
        <Link href="/" onClick={() => setMobileOpen?.(false)} className="flex items-center gap-4 group w-full">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-500 blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
            <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-500 border border-white/20">
              <ShieldCheck className="text-white w-7 h-7" />
            </div>
          </div>
          <span className="text-3xl font-black tracking-tighter text-white">PingForge</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2 relative z-10 w-full overflow-y-auto pr-1 no-scrollbar">
        {/* Overview Section */}
        <div className="mb-4">
          <button 
            onClick={() => toggleSection('overview')}
            className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 px-4 hover:text-gray-300 transition-colors"
          >
            Overview
            {expandedSections.includes('overview') ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
          <AnimatePresence initial={false}>
            {expandedSections.includes('overview') && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-1"
              >
                {overviewItems.map((item) => {
                  const isActive = item.path === '/dashboard' 
                    ? pathname === '/dashboard' 
                    : pathname.startsWith(item.path);

                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`w-full relative flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-[12.5px] transition-all duration-300 group
                        ${isActive
                          ? 'bg-blue-600/10 text-white border border-blue-500/20'
                          : 'text-gray-500 hover:text-white border border-transparent hover:bg-white/[0.02]'
                        }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-blue-500 rounded-r-md shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                        />
                      )}
                      <item.icon className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-blue-400' : 'text-gray-600'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Monitoring Section */}
        <div className="mb-4">
          <button 
            onClick={() => toggleSection('monitoring')}
            className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 px-4 hover:text-gray-300 transition-colors"
          >
            Monitoring
            {expandedSections.includes('monitoring') ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
          <AnimatePresence initial={false}>
            {expandedSections.includes('monitoring') && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-0.5"
              >
                {monitoringItems.map((item) => {
                  const isActive = item.path === '/dashboard/api' 
                    ? pathname === '/dashboard/api'
                    : pathname.startsWith(item.path);

                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`w-full relative flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-[12.5px] transition-all duration-300 group
                        ${isActive
                          ? 'bg-orange-500/10 text-white border border-orange-500/20'
                          : 'text-gray-500 hover:text-white border border-transparent hover:bg-white/[0.02]'
                        }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-monitoring-active"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-orange-500 rounded-r-md shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                        />
                      )}
                      <item.icon className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-orange-400' : 'text-gray-600'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Workspace Section */}
        {isAtLeast('member') && (
          <div className="mb-4">
            <button 
              onClick={() => toggleSection('workspace')}
              className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 px-4 hover:text-gray-300 transition-colors"
            >
              Workspace
              {expandedSections.includes('workspace') ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            <AnimatePresence initial={false}>
              {expandedSections.includes('workspace') && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-0.5"
                >
                  {workspaceItems.map((item) => {
                    const isActive = pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setMobileOpen?.(false)}
                        className={`w-full relative flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-[12.5px] transition-all duration-300 group
                          ${isActive
                            ? 'bg-violet-600/10 text-white border border-violet-500/20'
                            : 'text-gray-500 hover:text-white border border-transparent hover:bg-white/[0.02]'
                          }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-workspace-active"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-violet-500 rounded-r-md shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                          />
                        )}
                        <item.icon className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-violet-400' : 'text-gray-600'}`} />
                        {item.name}
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}


      </nav>

      {/* User Profile Section */}
      <div className="mt-auto pt-8 relative z-10 text-nowrap">
        <Link 
          href="/dashboard/profile"
          onClick={() => setMobileOpen?.(false)}
          className="w-full block relative p-[1px] rounded-[24px] bg-gradient-to-b from-white/[0.08] to-transparent overflow-hidden mb-4 group cursor-pointer hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all text-left"
        >
          <div className="bg-[#0a0a0a]/90 backdrop-blur-md rounded-[23px] px-4 py-4 flex items-center gap-4">
            <div className="relative w-11 h-11 flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
              <div className="relative w-full h-full rounded-full bg-[#111] p-[2px] border border-white/10 flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-black text-white shadow-inner">
                  {user?.fullName?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                </div>
              </div>
              {/* GREEN DOT INDICATOR */}
              {unreadCount > 0 && (
                <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[3px] border-[#0a0a0a] shadow-[0_0_10px_rgba(16,185,129,0.6)] z-10 animate-pulse" />
              )}
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[14px] font-black text-white truncate group-hover:text-indigo-300 transition-colors">{user?.fullName || 'User'}</span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate mt-0.5">{user?.companyName || 'Workspace'}</span>
            </div>
          </div>
        </Link>

        <button
          suppressHydrationWarning
          onClick={logout}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 text-gray-400 hover:text-white rounded-2xl text-[13px] font-bold transition-all duration-300 bg-white/[0.02] hover:bg-red-500/10 border border-white/[0.03] hover:border-red-500/20 group"
        >
          <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" /> Sign Out
        </button>

        <NotificationCenter isOpen={isNotifOpen} onClose={() => { setIsNotifOpen(false); fetchUnreadCount(); }} />
      </div>
    </aside>
    </>
  );
}
