'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Activity, Bell, BarChart3, Globe, ArrowRight, ArrowUpRight, CheckCircle2, Zap, User, Code2, CheckSquare, Heart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  const [dots, setDots] = React.useState<{ top: number, left: number, delay: number, duration: number }[]>([]);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    setDots([...Array(20)].map(() => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4
    })));

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 bg-background">
        {/* The Grid Layer - Tinted & Sharp */}
        <div className="bg-grid opacity-60" />

        {/* Background Light Center - Adding a subtle glow to the middle for depth */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 blur-[120px] rounded-full opacity-60 pointer-events-none" />

        {/* Mesh Gradients - Vibrant & Large */}
        <div className="mesh-circle w-[1200px] h-[1200px] bg-blue-600/15 -top-[400px] -left-[300px]" />
        <div className="mesh-circle w-[1000px] h-[1000px] bg-indigo-600/15 -bottom-[200px] -right-[200px] animation-delay-2000" />
        <div className="mesh-circle w-[700px] h-[700px] bg-purple-600/10 top-[15%] left-[25%]" />
        <div className="mesh-circle w-[800px] h-[800px] bg-sky-500/10 bottom-[20%] right-[30%] animation-delay-5000" />

        {/* Blinking Spots */}
        {dots.map((dot, i) => (
          <div
            key={i}
            className="blink-dot"
            style={{
              top: `${dot.top}%`,
              left: `${dot.left}%`,
              animationDelay: `${dot.delay}s`,
              animationDuration: `${dot.duration}s`,
              width: dot.top % 2 === 0 ? '1px' : '2px', // Varied size
              height: dot.top % 2 === 0 ? '1px' : '2px',
              opacity: 0.2 + (dot.left % 0.3)
            }}
          />
        ))}
        <div className="noise-overlay opacity-[0.02]" />
      </div>

      <div className="relative z-10 pt-24">
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled
          ? 'bg-background/80 backdrop-blur-xl border-white/10 py-4 shadow-2xl'
          : 'bg-transparent border-transparent py-6'
          }`}>
          <div className="flex items-center justify-between px-10 max-w-7xl mx-auto">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative flex items-center justify-center">
                {/* BRAND ICON GLOW - High Intensity Pulse */}
                <div className="absolute inset-0 bg-blue-500 blur-[25px] opacity-40 group-hover:opacity-80 transition-opacity duration-500 rounded-xl animate-pulse" />
                <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center border border-white/40 shadow-[0_0_25px_rgba(59,130,246,0.6)] transform group-hover:scale-110 transition-all duration-500">
                  <Shield className="text-white w-6 h-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
                </div>
              </div>
              <span className="text-xl font-black tracking-tighter text-white group-hover:text-blue-400 transition-colors">Monitor<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">P</span></span>
            </Link>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link href="/dashboard" className="text-sm font-medium text-gray-400 hover:text-white transition-colors mr-2">
                    Dashboard
                  </Link>
                  <Link href="/dashboard/profile" className="relative group/user flex items-center justify-center">
                    {/* USER ICON GLOW - High Intensity Pink/Indigo */}
                    <div className="absolute inset-0 bg-indigo-500 blur-[25px] opacity-30 group-hover/user:opacity-70 transition-opacity duration-500 rounded-full animate-pulse" />
                    <div className="relative w-10 h-10 rounded-full bg-[#111] p-[0.5px] border border-white/30 flex items-center justify-center overflow-hidden transition-all duration-500 group-hover/user:scale-110 group-hover/user:border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 to-purple-500/30" />
                      <User className="w-5 h-5 text-gray-400 group-hover/user:text-white transition-colors" />
                    </div>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                    Sign In
                  </Link>
                  <Link href="/register" className="premium-button">
                    Start Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative px-6 pt-20 pb-32 overflow-hidden">
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-sm font-medium mb-8"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Introducing Heartbeat & API Monitoring</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-7xl font-bold text-white mb-8 tracking-tight leading-tight"
            >
              Don't let your API go <span className="gradient-text">Down</span> without a fight.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              The comprehensive SaaS platform that watches over your APIs 24/7. Instant alerts, beautiful status pages, and deep performance insights.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/register" className="premium-button text-lg px-10 py-4 flex items-center gap-3 group">
                Get Started for Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/dashboard" className="premium-button btn-glow-purple text-lg px-10 py-4 flex items-center gap-3 group">
                Go to Dashboard <ArrowUpRight className="w-5 h-5 group-hover:rotate-45 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {/* Floating Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="max-w-6xl mx-auto mt-24 relative"
          >
            <div className="absolute inset-0 bg-blue-500/10 blur-[120px] rounded-full z-0 translate-y-20" />
            <div className="glass-card p-4 relative z-10 border-white/10 overflow-hidden shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] bg-[#030303]">

              {/* Window Controls & Mock URL Bar */}
              <div className="flex items-center gap-2 mb-6 px-4 py-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                </div>
                <div className="h-7 w-48 bg-white/[0.03] rounded-lg ml-6 border border-white/5" />
              </div>

              <div className="bg-[#030303] rounded-2xl overflow-hidden relative border border-white/5">
                {/* Mock Dashboard UI */}
                <div className="p-12">
                  <div className="flex justify-between items-center mb-16">
                    <div className="space-y-3">
                      <div className="h-4 w-40 bg-white/10 rounded-full" />
                      <div className="h-1.5 w-64 bg-white/5 rounded-full" />
                    </div>
                    <div className="flex gap-4">
                      <div className="w-32 h-11 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-lg shadow-blue-600/20">
                        ADD MONITOR
                      </div>
                      <div className="w-11 h-11 bg-white/5 rounded-xl border border-white/10" />
                    </div>
                  </div>

                  {/* Card Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {[
                      { name: 'Payment Gateway', status: 'UP', color: '#10b981', latency: '42ms', type: 'API' },
                      { name: 'Nightly Backup', status: 'UP', color: '#10b981', latency: 'Scheduled', type: 'HB' },
                      { name: 'Auth Service', status: 'UP', color: '#10b981', latency: '18ms', type: 'API' }
                    ].map((mock, i) => (
                      <div key={mock.name} className="bg-[#0c0c0e] border border-white/5 rounded-[24px] p-8 relative overflow-hidden group/card hover:border-white/10 transition-all">
                        <div className="flex justify-between items-start mb-10">
                          <div className="flex items-center gap-5">
                            <div className="relative w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center overflow-hidden">
                              <div className={`absolute inset-0 blur-xl opacity-20 ${mock.type === 'HB' ? 'bg-pink-500' : 'bg-blue-500'}`} />
                              {mock.type === 'HB' ? (
                                <Heart className="w-6 h-6 text-pink-500 relative z-10" />
                              ) : (
                                <Activity className="w-6 h-6 text-blue-500 relative z-10" />
                              )}
                              <div
                                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0c0c0e] z-20"
                                style={{ backgroundColor: mock.color }}
                              />
                            </div>
                            <div className="space-y-3">
                              <div className="text-[17px] font-bold text-white tracking-tight">{mock.name}</div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-white/5 text-gray-500`}>
                                  {mock.type === 'HB' ? 'Heartbeat' : 'API Monitor'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                            <ArrowUpRight className="w-4 h-4 text-gray-600" />
                          </div>
                        </div>
                        <div className="flex justify-between items-end mt-4">
                          <div className="h-3 w-16 bg-white/[0.03] rounded-full" />
                          <div className="flex items-baseline gap-1">
                            {mock.type === 'API' ? (
                              <>
                                <span className="text-xl font-black text-white">{mock.latency.replace('ms', '')}</span>
                                <span className="text-[10px] font-bold text-gray-600">MS</span>
                              </>
                            ) : (
                              <span className="text-xs font-bold text-emerald-500/80 uppercase tracking-widest">Healthy</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Global Live Activity Feed (Unique Feature) */}
                  <div className="mt-8">
                    <div className="flex items-center gap-2 mb-4 px-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Global Live Activity</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { time: '2s ago', event: 'Ping Received', source: 'Payment Gateway', region: 'US-East', status: 'success' },
                        { time: '14s ago', event: 'Backup Verified', source: 'Nightly Backup', region: 'EU-West', status: 'success' },
                        { time: '31s ago', event: 'Latency Spike', source: 'Auth Service', region: 'Asia-South', status: 'warning' },
                        { time: '1m ago', event: 'Ping Received', source: 'Payment Gateway', region: 'AU-East', status: 'success' }
                      ].map((item, i) => (
                        <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 flex items-center justify-between group/feed hover:bg-white/[0.04] transition-all">
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${item.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                              {item.status === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="text-[13px] font-bold text-white leading-none mb-1">{item.event}</div>
                              <div className="text-[10px] text-gray-600 font-medium">via {item.source} • {item.region}</div>
                            </div>
                          </div>
                          <div className="text-[10px] font-black text-gray-700 uppercase">{item.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Everything you need to sleep better</h2>
            <p className="text-gray-500 text-lg">Powerful monitoring tools for modern development teams.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Code2 className="w-6 h-6" />,
                title: "Advanced API Testing",
                desc: "Full support for custom headers, query parameters, and JSON request bodies — just like Postman.",
                color: "blue"
              },
              {
                icon: <CheckSquare className="w-6 h-6" />,
                title: "Dynamic Assertions",
                desc: "Verify status codes, response times, and body content to ensure your API logic is working 100%.",
                color: "purple"
              },
              {
                icon: <Globe className="w-6 h-6" />,
                title: "Public Status Pages",
                desc: "Build customer trust with beautiful, branded status pages that update in real-time.",
                color: "amber"
              },
              {
                icon: <Bell className="w-6 h-6" />,
                title: "Instant Incident Alerts",
                desc: "Get notified via Email the exact second your service becomes degraded or unreachable.",
                color: "rose"
              },
              {
                icon: <Activity className="w-6 h-6" />,
                title: "Regional Monitoring",
                desc: "We verify your services from multiple global regions to catch localized network issues.",
                color: "indigo"
              },
              {
                icon: <Heart className="w-6 h-6" />,
                title: "Heartbeat Monitoring",
                desc: "The ultimate 'Dead Man's Switch' for cron jobs and internal tasks. Monitor what pings can't reach.",
                color: "pink"
              }
            ].map((feature, i) => {
              const colors = {
                blue: "text-blue-500 bg-blue-500/10 border-blue-500/20 shadow-blue-500/10",
                purple: "text-purple-500 bg-purple-500/10 border-purple-500/20 shadow-purple-500/10",
                amber: "text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-amber-500/10",
                emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10",
                rose: "text-rose-500 bg-rose-500/10 border-rose-500/20 shadow-rose-500/10",
                indigo: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20 shadow-indigo-500/10",
                pink: "text-pink-500 bg-pink-500/10 border-pink-500/20 shadow-pink-500/10",
              };

              return (
                <motion.div
                  key={i}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="glass-card p-10 group relative overflow-hidden"
                >
                  <div className={`absolute -top-12 -left-12 w-24 h-24 blur-[60px] opacity-0 group-hover:opacity-40 transition-opacity duration-500 ${colors[feature.color as keyof typeof colors].split(' ')[0].replace('text-', 'bg-')}`} />

                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 mb-8 shadow-lg group-hover:scale-110 ${colors[feature.color as keyof typeof colors]}`}>
                    {feature.icon}
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-white transition-colors">{feature.title}</h3>
                  <p className="text-gray-500 leading-relaxed font-medium group-hover:text-gray-400 transition-colors">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="relative py-24 px-6 overflow-hidden">
          {/* Footer Background & Glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-600/5 to-indigo-600/10 z-0" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto flex flex-col items-center relative z-10">
            <div className="flex items-center gap-3 mb-10 group cursor-default">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-40 group-hover:opacity-80 transition-opacity duration-500 rounded-lg animate-pulse" />
                <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center border border-white/30 shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-transform duration-500 group-hover:scale-110">
                  <Shield className="text-white w-6 h-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                </div>
              </div>
              <span className="text-2xl font-black tracking-tighter text-white">Monitor<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">P</span></span>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 mb-12 text-sm font-bold uppercase tracking-widest">
              <Link href="/" className="text-gray-400 hover:text-blue-400 transition-all hover:scale-105">Home</Link>
              <Link href="/faq" className="text-gray-400 hover:text-purple-400 transition-all hover:scale-105">FAQ</Link>
              <Link href="/dashboard" className="text-gray-400 hover:text-emerald-400 transition-all hover:scale-105">Dashboard</Link>
              <Link href="/status" className="text-gray-400 hover:text-amber-400 transition-all hover:scale-105">Status</Link>
            </div>

            <p className="text-gray-500 mb-12 max-w-lg text-center leading-relaxed font-medium italic">
              "The world's most reliable API monitoring platform, built for the next generation of high-scale engineering teams."
            </p>

            <div className="w-full max-w-xs h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent mb-10" />

            <div className="flex flex-col items-center gap-4">
              <div className="text-[11px] font-black text-gray-600 uppercase tracking-[0.3em] mb-2">
                &copy; 2026 MonitorP SaaS • SECURED BY ANTIGRAVITY
              </div>
              <div className="flex gap-6">
                <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-gray-600 hover:text-white hover:border-white/20 transition-all cursor-pointer">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-gray-600 hover:text-white hover:border-white/20 transition-all cursor-pointer">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
