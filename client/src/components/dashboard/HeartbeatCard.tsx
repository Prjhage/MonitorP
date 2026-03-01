'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Clock, Globe, ArrowUpRight, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface HeartbeatCardProps {
    heartbeat: {
        _id: string;
        name: string;
        status: 'UP' | 'DOWN' | 'PENDING';
        lastPingAt: string;
        nextExpectedAt: string;
        isActive: boolean;
        expectedEvery: number;
        expectedEveryUnit: string;
    };
    onClick: () => void;
}

export default function HeartbeatCard({ heartbeat, onClick }: HeartbeatCardProps) {
    const isUp = heartbeat.status === 'UP' && heartbeat.isActive;
    const isDown = heartbeat.status === 'DOWN' && heartbeat.isActive;
    const isPaused = !heartbeat.isActive;
    const isPending = heartbeat.status === 'PENDING' && heartbeat.isActive;

    const statusColor = isPaused ? 'gray' : isUp ? 'emerald' : isDown ? 'red' : 'amber';

    const gradients = {
        emerald: 'from-emerald-500/20 via-emerald-500/5 to-transparent border-emerald-500/20 group-hover:border-emerald-500/50 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
        red: 'from-red-500/20 via-red-500/5 to-transparent border-red-500/20 group-hover:border-red-500/50 group-hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]',
        amber: 'from-amber-500/20 via-amber-500/5 to-transparent border-amber-500/20 group-hover:border-amber-500/50 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]',
        gray: 'from-gray-500/10 via-gray-500/5 to-transparent border-gray-500/20 group-hover:border-gray-500/40 opacity-75'
    };

    const textColors = {
        emerald: 'text-emerald-400',
        red: 'text-red-400',
        amber: 'text-amber-400',
        gray: 'text-gray-400'
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -6, scale: 1.01 }}
            onClick={onClick}
            className={`relative p-[1px] rounded-[32px] cursor-pointer group transition-all duration-500`}
        >
            <div className={`absolute inset-0 rounded-[32px] bg-gradient-to-br ${gradients[statusColor]} transition-all duration-500 z-0`} />

            <div className="relative bg-[#0a0a0a]/90 backdrop-blur-xl h-full rounded-[31px] p-7 flex flex-col z-10 overflow-hidden">

                <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full transition-all duration-700 opacity-40 group-hover:opacity-80
                    ${isPaused ? 'bg-gray-500' : isUp ? 'bg-emerald-500' : isDown ? 'bg-red-500' : 'bg-amber-500'}`}
                />

                <div className="flex justify-between items-start mb-6 relative">
                    <div className="flex items-center gap-4">
                        <div className={`relative flex items-center justify-center w-12 h-12 rounded-2xl bg-${statusColor}-500/10 border border-${statusColor}-500/20`}>
                            {isPaused || isPending ? (
                                <Heart className={`w-6 h-6 ${textColors[statusColor]}`} />
                            ) : (
                                <>
                                    <div className={`w-3 h-3 rounded-full shadow-[0_0_15px_currentColor] ${textColors[statusColor]} bg-current`} />
                                    <div className={`absolute inset-0 rounded-2xl animate-ping opacity-20 bg-${statusColor}-500`} />
                                </>
                            )}
                        </div>

                        <div>
                            <h3 className="text-xl font-black text-white group-hover:text-pink-400 transition-colors tracking-tight mb-1">
                                {heartbeat.name}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-${statusColor}-500/10 border border-${statusColor}-500/20 ${textColors[statusColor]}`}>
                                    {isPaused ? 'Paused' : heartbeat.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center group-hover:bg-white/10 transition-all group-hover:rotate-45">
                        <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                </div>

                <div className="mt-auto space-y-4">
                    <div className="flex items-center gap-3 bg-black/40 py-3 px-4 rounded-2xl border border-white/[0.03] group-hover:border-white/[0.08] transition-colors">
                        <Zap className="w-4 h-4 text-pink-400" />
                        <span className="text-xs text-gray-400 font-bold">
                            Every {heartbeat.expectedEvery} {heartbeat.expectedEveryUnit}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-b from-white/[0.04] to-transparent rounded-[20px] p-4 border border-white/[0.02]">
                            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                <Clock className="w-3.5 h-3.5 text-blue-400" /> Last Ping
                            </div>
                            <div className="text-xs font-bold text-gray-300 truncate mt-1">
                                {heartbeat.lastPingAt ? formatDistanceToNow(new Date(heartbeat.lastPingAt), { addSuffix: true }) : 'Waiting...'}
                            </div>
                        </div>

                        <div className="bg-gradient-to-b from-white/[0.04] to-transparent rounded-[20px] p-4 border border-white/[0.02]">
                            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                <Globe className="w-3.5 h-3.5 text-purple-400" /> Next Due
                            </div>
                            <div className="text-xs font-bold text-gray-300 truncate mt-1">
                                {heartbeat.nextExpectedAt ? formatDistanceToNow(new Date(heartbeat.nextExpectedAt), { addSuffix: true }) : '---'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
