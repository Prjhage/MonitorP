'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const caseStudies = [
    {
        company: 'ABC Tech Agency',
        industry: 'Software Agency',
        tag: 'Agency',
        tagColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        problem: 'Managing 15 client APIs with no monitoring system — issues discovered by clients first.',
        result: 'Caught 23 incidents before clients noticed — in first 30 days alone.',
        metric: '23',
        metricUnit: 'incidents caught',
        metricSub: 'client-facing issues averted',
        metricColor: 'text-blue-400',
        accentGlow: 'bg-blue-500/5',
    },
    {
        company: 'FinEdge Software',
        industry: 'Fintech',
        tag: 'Fintech',
        tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        problem: 'Payment API went down for 3 hours — client discovered it before the engineering team.',
        result: 'Zero client-reported incidents since switching to PingForge.',
        metric: '0',
        metricUnit: 'client complaints',
        metricSub: 'in the last 6 months',
        metricColor: 'text-emerald-400',
        accentGlow: 'bg-emerald-500/5',
    },
    {
        company: 'HealthTrack Systems',
        industry: 'Healthcare Tech',
        tag: 'Healthcare',
        tagColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        problem: 'Nightly patient data backup was silently failing for 3 weeks with no alerts.',
        result: 'Heartbeat monitor caught it on day 1 — potential data loss crisis averted.',
        metric: '₹12L',
        metricUnit: 'data loss prevented',
        metricSub: 'caught before client noticed',
        metricColor: 'text-rose-400',
        accentGlow: 'bg-rose-500/5',
    },
];

export default function CaseStudies() {
    return (
        <section className="relative py-28 px-6 overflow-hidden">
            {/* Background accents */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.04)_0%,transparent_60%)]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-4">Case Studies</p>
                    <h2 className="text-4xl font-black text-white tracking-tight mb-4">
                        Real results from real companies
                    </h2>
                    <p className="text-gray-500 text-lg max-w-xl mx-auto">
                        See how software teams use PingForge to protect their reputation and uptime
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6">
                    {caseStudies.map((cs, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -6 }}
                            className="glass-card p-7 flex flex-col relative overflow-hidden group"
                        >
                            {/* Hover glow */}
                            <div className={`absolute inset-0 ${cs.accentGlow} opacity-0 group-hover:opacity-100 transition-opacity blur-2xl`} />

                            {/* Tag + icon */}
                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <span className={`px-3 py-1 rounded-xl text-xs font-black border ${cs.tagColor}`}>{cs.tag}</span>
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                </div>
                            </div>

                            {/* Company info */}
                            <div className="relative z-10 mb-6">
                                <h3 className="text-white font-black text-lg mb-0.5">{cs.company}</h3>
                                <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">{cs.industry}</p>
                            </div>

                            {/* Problem / Result */}
                            <div className="space-y-4 mb-6 relative z-10 flex-1">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-600 mb-1">Problem</p>
                                    <p className="text-gray-400 text-sm leading-relaxed">{cs.problem}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-600 mb-1">Result</p>
                                    <p className="text-emerald-400 text-sm font-bold leading-relaxed">{cs.result}</p>
                                </div>
                            </div>

                            {/* Big metric */}
                            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 text-center mb-5 relative z-10">
                                <p className={`text-4xl font-black ${cs.metricColor}`}>{cs.metric}</p>
                                <p className="text-white font-black text-sm mt-1">{cs.metricUnit}</p>
                                <p className="text-gray-600 text-xs mt-0.5">{cs.metricSub}</p>
                            </div>

                            <Link href="/register" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-black mt-auto transition-colors relative z-10 group/link">
                                Start monitoring free
                                <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
