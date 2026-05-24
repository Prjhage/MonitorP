'use client';

import React from 'react';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import NotificationList from './NotificationList';

export default function NotificationCenter({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            // Force a slight delay and then maybe we could refresh, 
            // but the NotificationList manages its own state for now.
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
                    <motion.div
                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.95 }}
                        className="fixed top-6 right-6 bottom-6 w-full max-w-sm bg-[#0c0c0e] border border-white/10 rounded-[32px] shadow-2xl z-50 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                    <Bell className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white tracking-tight">Notifications</h3>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">In-app alerts</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={markAllAsRead}
                                    className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-indigo-500/10 transition-all"
                                >
                                    Mark All Read
                                </button>
                                <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* List Area */}
                        <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                            <NotificationList onAction={onClose} />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
