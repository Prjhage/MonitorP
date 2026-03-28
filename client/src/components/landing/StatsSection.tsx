'use client';
import React, { useRef } from 'react';
import { motion, useInView, useMotionValue, useSpring, animate } from 'framer-motion';
import { useEffect } from 'react';

const stats = [
    { value: 2400000, display: '2.4M+',  label: 'Pings Processed Daily',  suffix: '+', color: 'text-blue-400',    glow: 'bg-blue-500' },
    { value: 99.98,   display: '99.98%', label: 'Platform Uptime',         suffix: '%', color: 'text-emerald-400', glow: 'bg-emerald-500' },
    { value: 500,     display: '500+',   label: 'Companies Monitoring',    suffix: '+', color: 'text-purple-400',  glow: 'bg-purple-500' },
    { value: 45,      display: '45s',    label: 'Avg Alert Response Time', suffix: 's', color: 'text-amber-400',   glow: 'bg-amber-500' },
];

function AnimatedNumber({ value, suffix, color, triggered }: { value: number; suffix: string; color: string; triggered: boolean }) {
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (!triggered || !ref.current) return;
        const el = ref.current;
        const isLarge = value > 999;

        const controls = animate(0, value, {
            duration: 2.2,
            ease: [0.2, 0.8, 0.3, 1],
            onUpdate(v) {
                if (isLarge) {
                    el.textContent = (v / 1000000).toFixed(1) + 'M' + suffix;
                } else if (suffix === '%') {
                    el.textContent = v.toFixed(2) + suffix;
                } else {
                    el.textContent = Math.round(v) + suffix;
                }
            },
        });
        return controls.stop;
    }, [triggered, value, suffix]);

    return (
        <span ref={ref} className={`text-5xl font-black tracking-tight ${color}`}>0</span>
    );
}

export default function StatsSection() {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <section ref={ref} className="relative py-28 px-6 overflow-hidden">
            {/* Background accents */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.06)_0%,transparent_70%)]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-16"
                >
                    Trusted by software teams worldwide
                </motion.p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="relative group text-center bg-white/[0.02] border border-white/[0.05] rounded-[24px] p-8 overflow-hidden hover:border-white/10 transition-all"
                        >
                            {/* Glow */}
                            <div className={`absolute inset-0 ${stat.glow}/5 opacity-0 group-hover:opacity-100 transition-opacity blur-xl`} />
                            <AnimatedNumber
                                value={stat.value}
                                suffix={stat.suffix}
                                color={stat.color}
                                triggered={inView}
                            />
                            <p className="text-gray-600 text-xs font-bold uppercase tracking-widest mt-3">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
