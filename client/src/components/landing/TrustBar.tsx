'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle2, Shield, Zap } from 'lucide-react';

const items = [
    { icon: Users,         text: '500+ companies monitoring' },
    { icon: CheckCircle2,  text: '2.4M+ pings processed daily' },
    { icon: Shield,        text: '99.98% platform uptime' },
    { icon: Zap,           text: '< 45 second average alert time' },
];

export default function TrustBar() {
    return (
        <div className="relative border-y border-white/[0.05] bg-white/[0.01] backdrop-blur-xl overflow-hidden">
            {/* subtle gradient sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-transparent to-indigo-600/5 pointer-events-none" />
            <div className="max-w-6xl mx-auto px-6 py-5 relative z-10">
                <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
                    {items.map(({ icon: Icon, text }, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-2.5 text-gray-400 text-sm font-medium"
                        >
                            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/15">
                                <Icon className="w-3.5 h-3.5 text-blue-400" />
                            </div>
                            <span>{text}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
