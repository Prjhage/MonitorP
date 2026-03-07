'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Clock, Globe, ArrowUpRight, Zap, Play, Pause } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useCache } from '@/context/CacheContext';
import { useToast } from '@/context/ToastContext';

interface HeartbeatCardProps {
    heartbeat: {
        _id: string;
        name: string;
        status: 'UP' | 'DOWN' | 'PENDING' | 'RUNNING';
        lastPingAt: string;
        nextExpectedAt: string;
        isActive: boolean;
        isPaused: boolean;
        expectedEvery: number;
        expectedEveryUnit: string;
        avgJobDuration?: number;
        lastJobDuration?: number;
        currentJobStartedAt?: string;
        maxDuration?: number;
        maxDurationUnit?: string;
    };
    onClick: () => void;
}

export default function HeartbeatCard({ heartbeat, onClick }: HeartbeatCardProps) {
    const { toggleHeartbeat } = useCache();
    const { showToast } = useToast();
    const isUp = heartbeat.status === 'UP' && !heartbeat.isPaused;
    const isDown = heartbeat.status === 'DOWN' && !heartbeat.isPaused;
    const isRunning = heartbeat.status === 'RUNNING' && !heartbeat.isPaused;
    const isPaused = heartbeat.isPaused;
    const isPending = (heartbeat.status === 'PENDING' || !heartbeat.lastPingAt) && !heartbeat.isPaused;

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await toggleHeartbeat(heartbeat._id);
            showToast(heartbeat.isPaused ? "Heartbeat Resumed" : "Heartbeat Paused", "success");
        } catch (error) {
            showToast("Failed to update status", "error");
        }
    };

    const statusColor = isPaused ? 'gray' : isUp ? 'emerald' : isDown ? 'red' : isRunning ? 'amber' : 'amber';

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

    const formatDuration = (ms: number) => {
        if (!ms) return '---';
        if (ms < 1000) return `${ms}ms`;
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
        return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -6, scale: 1.01 }}
            onClick={onClick}
            className={`relative p-[1px] rounded-[32px] cursor-pointer group transition-all duration-500 shadow-2xl`}
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
                                <Heart className={`w-6 h-6 ${textColors[statusColor]} ${isPaused ? 'opacity-50' : ''}`} />
                            ) : (
                                <>
                                    <div className={`w-3 h-3 rounded-full shadow-[0_0_15px_currentColor] ${textColors[statusColor]} bg-current`} />
                                    <div className={`absolute inset-0 rounded-2xl animate-ping opacity-20 bg-${statusColor}-500 ${isRunning ? 'animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]' : ''}`} />
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
                                {isRunning && (
                                    <span className="text-[9px] font-bold text-amber-500/80 animate-pulse">
                                        RUNNING...
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleToggle}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPaused
                                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                                }`}
                            title={isPaused ? "Resume Monitoring" : "Pause Monitoring"}
                        >
                            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
                        </button>
                        <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center group-hover:bg-white/10 transition-all group-hover:rotate-45">
                            <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                        </div>
                    </div>
                </div>

                <div className="mt-auto space-y-4">
                    {/* Performance Stats */}
                    {isRunning ? (
                        <div className="bg-amber-500/5 border border-amber-500/10 py-3 px-4 rounded-2xl">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest mb-1.5">
                                <span className="text-amber-400 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Start Time</span>
                                <span className="text-gray-500">Usually takes: {formatDuration(heartbeat.avgJobDuration || 0)}</span>
                            </div>
                            <div className="text-sm font-bold text-white flex justify-between items-baseline">
                                <span>{heartbeat.currentJobStartedAt ? formatDistanceToNow(new Date(heartbeat.currentJobStartedAt), { addSuffix: true }) : 'Just now'}</span>
                                <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-amber-500"
                                        initial={{ width: "0%" }}
                                        animate={{ width: "70%" }}
                                        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 bg-black/40 py-3 px-4 rounded-2xl border border-white/[0.03] group-hover:border-white/[0.08] transition-colors">
                            <Zap className="w-4 h-4 text-pink-400" />
                            <span className="text-xs text-gray-400 font-bold">
                                Every {heartbeat.expectedEvery} {heartbeat.expectedEveryUnit}
                            </span>
                            {(heartbeat.avgJobDuration || 0) > 0 && (
                                <>
                                    <div className="h-4 w-[1px] bg-white/10 mx-1" />
                                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Avg Duo: {formatDuration(heartbeat.avgJobDuration || 0)}</span>
                                </>
                            )}
                        </div>
                    )}

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
