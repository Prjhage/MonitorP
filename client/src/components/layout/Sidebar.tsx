'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, Settings, LogOut, Bell,
  Activity, ShieldCheck, Home, Heart
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { name: 'Home Site', icon: Home, path: '/' },
    { name: 'API Monitoring', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Heartbeat Monitoring', icon: Heart, path: '/dashboard/heartbeats' },
    { name: 'Incidents Log', icon: Activity, path: '/dashboard/incidents' },
    { name: 'Settings', icon: Settings, path: '/dashboard/settings' },
  ];

  return (
    <aside className="w-72 border-r border-white/[0.04] flex flex-col p-6 h-screen sticky top-0 bg-[#0a0a0a]/60 backdrop-blur-3xl z-20 overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* Brand Header */}
      <div className="flex items-center gap-4 mb-14 mt-4 relative z-10">
        <Link href="/dashboard" className="flex items-center gap-4 group w-full">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-500 blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
            <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-500 border border-white/20">
              <ShieldCheck className="text-white w-7 h-7" />
            </div>
          </div>
          <span className="text-3xl font-black tracking-tighter text-white">Monitor<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">P</span></span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2 relative z-10 w-full">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 px-4">Menu</div>
        {navItems.map((item) => {
          // Exact match for base dashboard, prefix match for others
          const isActive = item.path === '/dashboard'
            ? pathname === item.path
            : pathname.startsWith(item.path) && item.path !== '/';

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`w-full relative flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-[14px] transition-all duration-300 group overflow-hidden
                ${isActive
                  ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/5 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-blue-500/20'
                  : 'text-gray-400 hover:text-white border border-transparent hover:bg-white/[0.03]'
                }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-r-md shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                />
              )}
              <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-blue-400' : 'text-gray-500'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="mt-auto pt-8 relative z-10">
        <div className="relative p-[1px] rounded-[24px] bg-gradient-to-b from-white/[0.08] to-transparent overflow-hidden mb-4 group cursor-pointer hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all">
          <div className="bg-[#0a0a0a]/90 backdrop-blur-md rounded-[23px] px-4 py-4 flex items-center gap-4">
            <div className="relative w-11 h-11 flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
              <div className="relative w-full h-full rounded-full bg-[#111] p-[2px] border border-white/10 flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-black text-white shadow-inner">
                  {user?.fullName?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                </div>
              </div>
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[14px] font-black text-white truncate group-hover:text-indigo-300 transition-colors">{user?.fullName || 'User'}</span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate mt-0.5">{user?.companyName || 'Workspace'}</span>
            </div>

            {/* <button className="p-2 bg-white/[0.03] hover:bg-white/10 rounded-xl transition-colors shrink-0">
              <Settings className="w-4 h-4 text-gray-400" />
            </button> */}
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 text-gray-400 hover:text-white rounded-2xl text-[13px] font-bold transition-all duration-300 bg-white/[0.02] hover:bg-red-500/10 border border-white/[0.03] hover:border-red-500/20 group"
        >
          <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
