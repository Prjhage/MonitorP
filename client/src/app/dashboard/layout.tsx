'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/layout/Sidebar';


function NotAuthenticated() {
  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="mesh-circle w-[600px] h-[600px] bg-blue-600/15 -top-[200px] -left-[100px]" />
        <div className="mesh-circle w-[500px] h-[500px] bg-indigo-600/15 -bottom-[100px] -right-[100px]" />
        <div className="noise-overlay" />
        <div className="bg-grid opacity-40" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-col items-center text-center max-w-md"
      >
        {/* Logo */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-blue-500 blur-[30px] opacity-30 rounded-2xl animate-pulse" />
          <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center border border-white/20 shadow-[0_0_30px_rgba(59,130,246,0.5)]">
            <Shield className="w-8 h-8 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-white tracking-tight mb-3">
          Sign in to PingForge
        </h1>
        <p className="text-gray-500 mb-10 leading-relaxed font-medium">
          You need to be logged in to access your monitoring dashboard. Sign in or create a free account to get started.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          <Link href="/login" className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all">
            <LogIn className="w-4 h-4" />
            Sign In
          </Link>
          <Link href="/register" className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-gray-300 font-black text-sm uppercase tracking-widest hover:bg-white/[0.07] hover:text-white transition-all">
            Create Account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="mt-8 text-xs text-gray-600 font-bold">
          Free forever · No credit card required
        </p>
      </motion.div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // While auth state is being determined, show nothing (avoids flash)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in — show the login required screen
  if (!user) {
    return <NotAuthenticated />;
  }

  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#030303] relative overflow-hidden">
        {/* Animated Background */}
        <div className="bg-animate">
          <div className="mesh-circle w-[600px] h-[600px] bg-blue-600/20 -top-[200px] -left-[100px]" />
          <div className="mesh-circle w-[500px] h-[500px] bg-purple-600/20 -bottom-[100px] -right-[100px] animation-delay-2000" />
          <div className="noise-overlay" />
        </div>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-white/[0.04] bg-[#0a0a0a]/80 backdrop-blur-md relative z-30">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            <span className="text-xl font-black text-white">PingForge</span>
          </div>
          <button 
            onClick={() => setMobileOpen(true)}
            className="p-2 bg-white/5 rounded-xl text-gray-400 hover:text-white"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        </header>

        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <main className="flex-1 overflow-y-auto relative z-10 pb-20 md:pb-0">
          {children}
        </main>
      </div>
  );
}
