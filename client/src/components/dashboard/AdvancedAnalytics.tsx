'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Activity, Clock, Zap, Percent, 
    BarChart3, TrendingUp, AlertTriangle, 
    Target, Gauge 
} from 'lucide-react';

interface AdvancedStats {
    p50: number;
    p95: number;
    p99: number;
    errorRate: number;
    throughput: number;
    apdex: number;
    totalRequests: number;
    status: string;
}

const itemVariants = { 
    hidden: { opacity: 0, y: 24 }, 
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 26, stiffness: 110 } } 
};

export default function AdvancedAnalytics({ stats, loading }: { stats: AdvancedStats | null, loading: boolean }) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="glass-card p-6 border border-white/[0.05] h-32 animate-pulse" />
                ))}
            </div>
        );
    }

    if (!stats || stats.status === 'no_data') {
        return (
            <div className="glass-card p-12 border border-white/[0.05] text-center">
                <BarChart3 className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-black text-white mb-2">Insufficient Data</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                    We need at least 24 hours of monitoring data to generate advanced analytics insights.
                </p>
            </div>
        );
    }

    const metrics = [
        { 
            label: 'P50 Latency', 
            value: `${stats.p50}ms`, 
            icon: Clock, 
            sub: 'Median Response', 
            color: 'text-emerald-500',
            glow: 'rgba(16, 185, 129, 0.1)'
        },
        { 
            label: 'P95 Latency', 
            value: `${stats.p95}ms`, 
            icon: Activity, 
            sub: '95th Percentile', 
            color: 'text-amber-500',
            glow: 'rgba(245, 158, 11, 0.1)',
            warning: stats.p95 > 800 
        },
        { 
            label: 'P99 Latency', 
            value: `${stats.p99}ms`, 
            icon: Zap, 
            sub: 'Worst 1% tail', 
            color: 'text-red-500',
            glow: 'rgba(239, 68, 68, 0.1)',
            alert: stats.p99 > 2000 
        },
        { 
            label: 'Error Rate', 
            value: `${stats.errorRate}%`, 
            icon: AlertTriangle, 
            sub: 'Failed Requests', 
            color: 'text-blue-500',
            glow: 'rgba(59, 130, 246, 0.1)'
        },
        { 
            label: 'Throughput', 
            value: `${stats.throughput}`, 
            icon: Gauge, 
            sub: 'Avg Reqs / Hour', 
            color: 'text-purple-500',
            glow: 'rgba(168, 85, 247, 0.1)'
        },
        { 
            label: 'Apdex Score', 
            value: stats.apdex.toFixed(2), 
            icon: Target, 
            sub: 'User Satisfaction', 
            color: 'text-indigo-500',
            glow: 'rgba(99, 102, 241, 0.1)'
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {metrics.map((m, i) => (
                <motion.div 
                    key={i} 
                    variants={itemVariants} 
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="glass-card p-6 border border-white/[0.05] hover:border-white/[0.1] transition-all duration-300 relative overflow-hidden group cursor-default"
                >
                    {/* Background glow on hover */}
                    <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
                        style={{ background: `radial-gradient(circle at top right, ${m.glow}, transparent 70%)` }}
                    />
                    
                    {/* Ghost Icon */}
                    <div className={`absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500 scale-100 group-hover:scale-110`}>
                        <m.icon className="w-full h-full text-white" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className={`p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] ${m.color}`}>
                                    <m.icon className="w-4 h-4" />
                                </div>
                                <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.15em]">{m.label}</span>
                            </div>
                            
                            <div className="flex gap-1.5">
                                {m.warning && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                                        <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                                        <span className="text-[9px] font-black text-amber-500 tracking-tighter">WARN</span>
                                    </div>
                                )}
                                {m.alert && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                                        <span className="text-[9px] font-black text-red-500 tracking-tighter">CRIT</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="text-4xl font-black text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all duration-300 tracking-tighter mb-1.5">
                            {m.value}
                        </div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                            {m.sub}
                            <TrendingUp className="w-3 h-3 text-white/10 group-hover:text-white/30 transition-colors" />
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
