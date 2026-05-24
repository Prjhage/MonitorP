'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, Settings, LogOut, Bell,
  Activity, ShieldCheck, Home, Heart, Sparkles, Lock, Key, Server, Globe, Calendar,
  Users, Wrench, ClipboardList, ChevronDown, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTour, TourStep } from '@/context/TourContext';
import NotificationCenter from '@/components/dashboard/NotificationCenter';
import api from '@/services/api';

export default function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen?: boolean; setMobileOpen?: (open: boolean) => void }) {
  const { user, logout, isAtLeast } = useAuth();
  const pathname = usePathname();
  const { startTour, isTourActive } = useTour();
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
    { name: 'API Key Vault', icon: Key, path: '/dashboard/api-keys' },
  ];

  const workspaceItems = [
    { name: 'Team Members', icon: Users, path: '/dashboard/team' },
    { name: 'Maintenance', icon: Wrench, path: '/dashboard/maintenance' },
    { name: 'Audit Log', icon: ClipboardList, path: '/dashboard/audit-log' },
  ];

  const handleStartTour = () => {
    let steps: TourStep[] = [];

    // Check for open modals FIRST
    const apiModalOpen = !!document.getElementById('tour-form-name');
    const hbModalOpen = !!document.getElementById('tour-hb-form-name');
    const sslModalOpen = !!document.getElementById('tour-ssl-form-name');

    if (apiModalOpen) {
      steps = [
        {
          target: '#tour-tab-basic',
          title: 'Configuration Hub',
          content: 'Our forms are modular. Use "Basic" for identity, "Advanced" for technical payloads, and "Assertions" for validation logic.',
          action: () => document.getElementById('tour-tab-basic')?.click()
        },
        {
          target: '#tour-form-name',
          title: 'Friendly Identity',
          content: 'Give your monitor a unique name like "Main Production API" to find it easily in the dashboard.',
          action: () => document.getElementById('tour-tab-basic')?.click()
        },
        { target: '#tour-form-url', title: 'Endpoint URL', content: 'The destination our agents will ping. We support secure HTTPS and standard HTTP endpoints globally.' },
        { target: '#tour-form-frequency', title: 'Check Frequency', content: 'How often should we monitor? Higher frequency means faster incident detection but more data usage.' },
        { target: '#tour-form-email', title: 'Alert Routing', content: 'Enter the email address that should receive instant DOWN notifications if this endpoint fails.' },

        // Advanced Section
        {
          target: '#tour-tab-advanced',
          title: 'Advanced Options',
          content: 'Configure headers, query parameters, and custom JSON payloads for complex API interactions.',
          action: () => document.getElementById('tour-tab-advanced')?.click()
        },
        {
          target: '#tour-form-headers',
          title: 'Custom Headers',
          content: 'Need to send an API Key or Authorization token? Click "Add Header" to define custom key-value pairs.',
          action: () => document.getElementById('tour-tab-advanced')?.click()
        },
        {
          target: '#tour-form-params',
          title: 'Query Parameters',
          content: 'Add dynamic parameters to your URL. We automatically append these to the endpoint during every check.',
          action: () => document.getElementById('tour-tab-advanced')?.click()
        },
        {
          target: '#tour-form-body',
          title: 'JSON Payload',
          content: 'For POST or PUT requests, you can define a custom JSON body to test specific API logic.',
          action: () => document.getElementById('tour-tab-advanced')?.click()
        },

        // Assertions Section
        {
          target: '#tour-tab-assertions',
          title: 'Validation Rules',
          content: 'Assertions are the "brain" of your monitor. They check status codes, response times, or JSON content to ensure real health.',
          action: () => document.getElementById('tour-tab-assertions')?.click()
        },
        {
          target: '#tour-form-assertions',
          title: 'Smart Assertions',
          content: 'Configure rules here to validate that your API is not just UP, but returning the CORRECT data.',
          action: () => document.getElementById('tour-tab-assertions')?.click()
        },

        { target: '#tour-form-submit', title: 'Activate Monitor', content: 'Ready? Confirm your settings to start the real-time monitoring engine across our global network.' }
      ];
    } else if (hbModalOpen) {
      steps = [
        { target: '#tour-hb-form-name', title: 'Heartbeat Identity', content: 'Name your job (e.g., "Nightly Backup"). Unlike API monitors, heartbeats are "Passive"—they wait for YOUR server to ping THEM.' },
        { target: '#tour-hb-form-type', title: 'Scheduling System', content: 'Use "Interval" for fixed timelines (e.g. every hour) or "Cron" for specific schedules (e.g. 2:00 AM every Tuesday).' },
      ];

      if (document.getElementById('tour-hb-cron-expr')) {
        steps.push({ target: '#tour-hb-cron-expr', title: 'Cron Syntax', content: 'Define standard Unix cron expressions here. We support minute-level precision for all your complex tasks.' });
        steps.push({ target: '#tour-hb-timezone', title: 'Timezone Sync', content: 'Ensure the heartbeat matches your server clock by selecting the correct local timezone.' });
      } else if (document.getElementById('tour-hb-interval')) {
        steps.push({ target: '#tour-hb-interval', title: 'Expected Interval', content: 'How often do you expect this job to run? If we don\'t hear from you within this window, we\'ll alert you immediately.' });
      }

      steps.push({ target: '#tour-hb-duration', title: 'Work Window', content: 'Max Duration is how long your job usually takes. If it exceeds this, we mark it as "Stuck" and alert you.' });
      steps.push({ target: '#tour-hb-grace', title: 'Grace Period', content: 'The "Safety Buffer". We wait this many extra minutes before sounding the alarm, preventing false alerts from network lag.' });
      steps.push({ target: '#tour-hb-email', title: 'Incident Notification', content: 'Where should we send the alert if your job fails or goes silent? Multi-recipient support coming soon.' });
      steps.push({ target: '#tour-hb-form-submit', title: 'Go Live', content: 'Activate the monitor to get your unique Ping URL. You will then need to add a simple CURL call to your script.' });
    } else if (sslModalOpen) {
      steps = [
        { target: '#tour-ssl-form-name', title: 'Friendly Name', content: 'Give your SSL monitor an easy-to-read identity.' },
        { target: '#tour-ssl-form-domain', title: 'Domain Address', content: 'Enter the bare domain (e.g., mysite.com). Do not include https:// or any trailing paths.' },
        { target: '#tour-ssl-form-email', title: 'Expiry Alerts', content: 'We will proactively email this address when your certificate is approaching expiration.' },
        { target: '#tour-ssl-form-submit', title: 'Begin Tracking', content: 'Add the monitor. We will immediately fetch and validate the certificate chain.' },
      ];
    } else if (pathname === '/dashboard') {
      steps = [
        { target: '#tour-add-monitor', title: 'Add New Monitor', content: 'Click here to start monitoring a new API endpoint. You can configure headers, body, and custom assertions.' },
        { target: '#tour-search', title: 'Quick Search', content: 'Easily find any monitor by its name or URL using this search bar.' },
        { target: '#tour-api-grid', title: 'Live Status Grid', content: 'These cards show the real-time status of your APIs. Green means UP, Red means DOWN, and Amber means PENDING or DEGRADED.', position: 'right' },
      ];
    } else if (pathname === '/dashboard/heartbeats') {
      steps = [
        { target: '#tour-add-hb', title: 'New Heartbeat', content: 'Set up a new passive monitor for your cron jobs or background tasks.' },
        { target: '#tour-hb-list', title: 'Heartbeat Monitors', content: 'Track the health of your periodic jobs. You can pause monitoring during maintenance right from the cards.', position: 'right' },
      ];
    } else if (pathname.startsWith('/dashboard/heartbeats/')) {
      steps = [
        { target: '#tour-hb-status', title: 'Live Health Status', content: 'Is your background job checking in? This indicator shows if we\'ve received a signal within the expected timeframe.' },
        { target: '#tour-hb-avg-duration', title: 'Average Runtime', content: 'We track how long your job usually takes. Use this to detect "Ghost" processes that finish too fast or too slow.', position: 'right' },
        { target: '#tour-hb-max-limit', title: 'Safety Timeout', content: 'Your defined "Stuck" threshold. If a job runs longer than this, we\'ll alert you immediately.' },
        { target: '#tour-integration', title: 'Dynamic Signal API', content: 'Integrate in seconds! Use these start, success, and fail signals to track the full lifecycle of your tasks.', position: 'top' },
        { target: '#tour-latency-chart', title: 'Execution Timeline', content: 'A visual trend of your job performance. Spikes here might indicate database bottlenecks or resource leaks.' },
        { target: '#tour-hb-incidents-sidebar', title: 'Failure Log', content: 'Every missed heartbeat or manual failure signal is recorded here for post-mortem analysis.', position: 'left' },
        { target: '#tour-pause-toggle', title: 'Maintenance Mode', content: 'Pausing here stops all alerts. Use this when performing server maintenance or database migrations.', position: 'bottom' },
      ];
    } else if (pathname === '/dashboard/ssl') {
      steps = [
        { target: '#tour-add-ssl', title: 'Add Certificate', content: 'Track an SSL certificate by just entering its domain. We automatically fetch the chain and expiry dates.', position: 'bottom' },
        { target: '#tour-ssl-search', title: 'Find Certificates', content: 'Search through your monitored domains instantly.', position: 'bottom' },
        { target: '#tour-ssl-grid', title: 'Certificate Status', content: 'View real-time remaining days and validation status. Cards turn amber or red as expiry approaches.', position: 'left' },
      ];
    } else if (pathname.startsWith('/dashboard/ssl/')) {
      steps = [
        { target: '#tour-ssl-days', title: 'Expiry Countdown', content: 'See exactly how many days are left until the SSL certificate expires. If it turns red, renew immediately!' },
        { target: '#tour-ssl-details', title: 'Certificate Information', content: 'View details about the issuer, organization, and the exact validity dates extracted from the cert.' },
        { target: '#tour-ssl-recheck', title: 'Manual Refresh', content: 'Click here to force our agents to re-fetch the certificate and verify its current status.', position: 'left' },
        { target: '#tour-ssl-alerts', title: 'Notification Milestones', content: 'A record of which expiration alerts have been automatically sent to your email.' },
      ];
    } else if (pathname === '/dashboard/api-keys') {
      steps = [
        { target: '#tour-add-key', title: 'Vault New Key', content: 'Securely track new API keys for external services like Stripe or AWS so you never miss a rotation.', position: 'bottom' },
        { target: '#tour-keys-grid', title: 'Key Inventory', content: 'View your keys, their environment tags, and expiry alerts. You can quickly remove tracking from here.', position: 'left' },
      ];
    } else if (pathname === '/dashboard/tcp') {
      steps = [
        { target: '#tour-add-tcp', title: 'Add Port Monitor', content: 'Set up a raw TCP connection check. Perfect for tracking databases like MySQL or caching servers like Redis.' },
        { target: '#tour-tcp-search', title: 'Quick Search', content: 'Instantly find any host or port across your entire network.' },
        { target: '#tour-tcp-grid', title: 'Status Overview', content: 'Track response times and uptime for all your TCP connections in real time.', position: 'right' },
      ];
    } else if (pathname === '/dashboard/dns') {
      steps = [
        { target: '#tour-add-dns', title: 'Add DNS Monitor', content: 'Start monitoring A, AAAA, MX, and CNAME records to detect unauthorized or accidental changes.' },
        { target: '#tour-dns-search', title: 'Find Domains', content: 'Filter your DNS monitors by domain name instantly.' },
        { target: '#tour-dns-grid', title: 'Record Status', content: 'Cards turn amber if the live DNS records deviate from your established baseline.', position: 'right' },
      ];
    } else if (pathname === '/dashboard/domains') {
      steps = [
        { target: '#tour-add-domain', title: 'Add Domain Monitor', content: 'Enter any domain to automatically extract WHOIS data and track its registration expiry date.' },
        { target: '#tour-domain-search', title: 'Search Expirations', content: 'Find specific domains across your portfolio quickly.' },
        { target: '#tour-domain-grid', title: 'Expiry Urgency', content: 'Cards are auto-sorted and color-coded. Red means critical danger — renew immediately!', position: 'right' },
      ];
    } else if (pathname.startsWith('/dashboard/') && !pathname.includes('/incidents') && !pathname.includes('/profile') && !pathname.includes('/ssl') && !pathname.includes('/api-keys') && !pathname.includes('/tcp') && !pathname.includes('/dns') && !pathname.includes('/domains')) {
      steps = [
        { target: '#tour-api-uptime', title: 'Availability Score', content: 'Your 24-hour uptime percentage. We aggregate pings from all worldwide agents to calculate this real-time health score.' },
        { target: '#tour-api-latency', title: 'Global Response Time', content: 'The average time it takes for our agents to receive a full response. Lower is better for user experience!' },
        { target: '#tour-api-assertions', title: 'Validation Engine', content: 'Beyond status codes: we check JSON bodies, search for strings, and validate headers to ensure your API is truly functional.' },
        { target: '#tour-api-geo', title: 'Regional Performance', content: 'Detect localized issues. If Europe is slow but the US is fast, it might be a routing or CDN configuration problem.' },
        { target: '#tour-api-incidents', title: 'Downtime History', content: 'A complete audit trail of every incident, including the precise reason (e.g., Timeout, 500 Error, or Assertion Failure).' },
        { target: '#tour-api-logs', title: 'Raw Ping Audit', content: 'The heartbeat of your monitor. Dive into individual ping results to see status codes and exact millisecond latency.' },
        { target: '#tour-api-edit', title: 'Instant Refactor', content: 'Update your endpoint, change the check interval, or add custom headers on the fly without breaking your history.' },
      ];
    }

    if (steps.length > 0) {
      startTour(steps);
    }
  };

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

        {/* Interactive Guide Trigger */}
        <div className="pt-4 pb-2">
          <button
            suppressHydrationWarning
            disabled={isTourActive}
            onClick={handleStartTour}
            className="w-full group relative p-[1px] rounded-xl overflow-hidden active:scale-95 transition-all disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 opacity-20 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/[0.02] rounded-[11px] px-4 py-2.5 flex items-center gap-3 group-hover:bg-transparent transition-colors duration-500">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:text-white transition-colors" />
              <span className="text-[12px] font-black text-white">System Guide</span>
            </div>
          </button>
        </div>
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
