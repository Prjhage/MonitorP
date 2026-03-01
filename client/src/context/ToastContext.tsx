'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className="pointer-events-auto"
                        >
                            <ToastItem toast={toast} onRemove={() => removeToast(toast.id)} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
        error: <XCircle className="w-5 h-5 text-red-400" />,
        warning: <AlertCircle className="w-5 h-5 text-amber-400" />,
        info: <Info className="w-5 h-5 text-blue-400" />,
    };

    const colors = {
        success: 'border-emerald-500/20 bg-emerald-500/5',
        error: 'border-red-500/20 bg-red-500/5',
        warning: 'border-amber-500/20 bg-amber-500/5',
        info: 'border-blue-500/20 bg-blue-500/5',
    };

    return (
        <div className={`flex items-center gap-4 px-5 py-4 min-w-[320px] max-w-md rounded-2xl border backdrop-blur-xl shadow-2xl ${colors[toast.type]}`}>
            <div className="shrink-0">{icons[toast.type]}</div>
            <p className="flex-1 text-sm font-bold text-white leading-relaxed">{toast.message}</p>
            <button
                onClick={onRemove}
                className="shrink-0 p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
}
