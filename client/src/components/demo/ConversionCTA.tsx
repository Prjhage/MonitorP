'use client';
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { X, ArrowRight, Zap, Shield, Heart, Lock } from 'lucide-react';

export default function ConversionCTA({ onClose }: { onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-50 w-80"
        >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-[28px]" />

            <div className="relative p-[1px] rounded-[28px] bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600">
                <div className="relative bg-[#0d0d12]/95 backdrop-blur-2xl rounded-[27px] p-6">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                            <Zap className="w-4 h-4 text-yellow-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-yellow-400/80">Ready to Monitor for Real?</span>
                    </div>

                    <h3 className="text-xl font-black text-white mb-2 tracking-tight">Start free in 2 minutes</h3>
                    <p className="text-sm text-gray-400 mb-5 leading-relaxed">
                        No credit card needed. Monitor 3 APIs, 3 heartbeats, and 2 SSL certs — free forever.
                    </p>

                    <div className="grid grid-cols-2 gap-2 mb-5">
                        {[
                            { icon: Shield, text: 'API Monitoring' },
                            { icon: Heart, text: 'Heartbeat Jobs' },
                            { icon: Lock, text: 'SSL Tracking' },
                            { icon: Zap, text: 'Instant Alerts' },
                        ].map(({ icon: Icon, text }) => (
                            <div key={text} className="flex items-center gap-2 text-xs text-gray-500">
                                <Icon className="w-3 h-3 text-blue-500" /> {text}
                            </div>
                        ))}
                    </div>

                    <Link href="/register" className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all text-center">
                        Create Free Account <ArrowRight className="w-4 h-4" />
                    </Link>

                    <p className="text-center text-[10px] text-gray-600 mt-3 font-bold">No credit card • Setup in 5 mins</p>
                </div>
            </div>
        </motion.div>
    );
}
