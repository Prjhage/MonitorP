'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info';
    onConfirm: () => void | Promise<void>;
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => void;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const confirm = useCallback((opts: ConfirmOptions) => {
        setOptions(opts);
        setIsOpen(true);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        setTimeout(() => setOptions(null), 300);
    };

    const handleConfirm = async () => {
        if (options?.onConfirm) {
            await options.onConfirm();
        }
        handleClose();
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <AnimatePresence>
                {isOpen && options && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleClose}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md glass-card p-8 shadow-2xl overflow-hidden border border-white/10"
                        >
                            {/* Danger glow */}
                            {options.type === 'danger' && (
                                <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50" />
                            )}

                            <div className="flex items-start gap-5">
                                <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${options.type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-black text-white mb-2 tracking-tight">{options.title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">{options.message}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mt-8">
                                <button
                                    onClick={handleClose}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    {options.cancelText || 'Cancel'}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className={`flex-1 py-3 rounded-xl font-black text-sm text-white shadow-lg transition-all ${options.type === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20'}`}
                                >
                                    {options.confirmText || 'Confirm'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) throw new Error('useConfirm must be used within a ConfirmProvider');
    return context;
}
