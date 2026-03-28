'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';

export default function DemoBanner() {
    const [visible, setVisible] = useState(true);
    if (!visible) return null;

    return (
        <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-amber-500/20 border-b border-amber-500/30 backdrop-blur-xl"
        >
            <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/20">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                    <span className="text-sm font-black text-white">LIVE DEMO MODE</span>
                    <span className="text-sm font-medium text-gray-400 ml-2">— You are viewing a demo dashboard with sample data. Nothing here is real.</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Link href="/register" className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-4 py-1.5 rounded-xl text-sm font-black transition-all active:scale-95">
                    Sign up free <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button onClick={() => setVisible(false)} className="text-gray-500 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}
