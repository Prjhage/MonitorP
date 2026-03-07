'use client';

import React, { useEffect, useState } from 'react';
import { Monitor, Smartphone, Layout } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DesktopOnly() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkSize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        checkSize();
        window.addEventListener('resize', checkSize);
        return () => window.removeEventListener('resize', checkSize);
    }, []);

    if (!isMobile) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center p-6 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-md bg-white/[0.03] border border-white/[0.08] backdrop-blur-3xl rounded-[2.5rem] p-10 text-center shadow-2xl overflow-hidden"
            >
                {/* Decorative mesh */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(59,130,246,0.15),transparent)]" />

                <div className="relative z-10">
                    <div className="mb-8 inline-flex items-center justify-center">
                        <div className="relative">
                            <motion.div
                                animate={{
                                    scale: [1, 1.1, 1],
                                    opacity: [0.5, 0.8, 0.5]
                                }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full"
                            />
                            <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Monitor className="w-12 h-12 text-white" strokeWidth={1.5} />
                            </div>
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">
                        Desktop Experience Only
                    </h1>

                    <p className="text-gray-400 text-lg leading-relaxed mb-10">
                        MonitorP is a professional engineering suite designed for high-resolution displays. Please access this dashboard from a <span className="text-blue-400 font-medium">Desktop or Laptop</span>.
                    </p>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4 bg-white/[0.05] p-5 rounded-2xl border border-white/[0.05]">
                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                                <Smartphone className="w-5 h-5 text-gray-500" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm text-gray-400">Current Device</p>
                                <p className="text-white font-medium">Mobile / Tablet</p>
                            </div>
                            <div className="ml-auto">
                                <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-blue-500/10 p-5 rounded-2xl border border-blue-500/20">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                <Layout className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm text-blue-400/70">Required Device</p>
                                <p className="text-white font-medium">Desktop (1024px+)</p>
                            </div>
                            <div className="ml-auto">
                                <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 flex items-center justify-center gap-2 text-gray-500 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                        <span>monitor-p.com/engineering</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
