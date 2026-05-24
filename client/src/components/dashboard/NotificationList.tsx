'use client';

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Bell, CheckCircle2, AlertCircle, Info, Trash2, ExternalLink, Loader2, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'incident' | 'maintenance' | 'team';
    link?: string;
    isRead: boolean;
    createdAt: string;
}

interface NotificationListProps {
    onAction?: () => void;
    maxItems?: number;
}

export default function NotificationList({ onAction, maxItems }: NotificationListProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [pendingInvites, setPendingInvites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [acceptingId, setAcceptingId] = useState<string | null>(null);
    const router = useRouter();

    const fetchNotifications = async () => {
        try {
            const [notifRes, inviteRes] = await Promise.all([
                api.get('/notifications'),
                api.get('/team/invites/me')
            ]);
            setNotifications(notifRes.data);
            setPendingInvites(inviteRes.data);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error('Failed to mark as read', err);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (err) {
            console.error('Failed to delete notification', err);
        }
    };

    const handleAcceptInvite = async (inviteId: string, notifId: string) => {
        setAcceptingId(inviteId);
        try {
            await api.post(`/team/invites/accept/${inviteId}`);
            await markAsRead(notifId);
            if (onAction) onAction();
            router.push('/dashboard');
            window.location.reload();
        } catch (err) {
            console.error('Failed to accept invite', err);
        } finally {
            setAcceptingId(null);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
            case 'warning': return <AlertCircle className="w-4 h-4 text-amber-400" />;
            case 'error':
            case 'incident': return <AlertCircle className="w-4 h-4 text-red-400" />;
            default: return <Info className="w-4 h-4 text-blue-400" />;
        }
    };

    const displayNotifications = maxItems ? notifications.slice(0, maxItems) : notifications;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                <p className="text-gray-500 text-sm font-medium">Fetching alerts...</p>
            </div>
        );
    }

    if (notifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-white font-bold">All caught up!</p>
                <p className="text-gray-500 text-xs mt-1">No new notifications at the moment.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {displayNotifications.map(notif => (
                <div 
                    key={notif._id} 
                    className={`group relative p-4 rounded-2xl border transition-all duration-300 ${
                        notif.isRead 
                            ? 'bg-white/[0.01] border-white/[0.03] opacity-70' 
                            : 'bg-white/[0.04] border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.2)]'
                    }`}
                    onClick={() => !notif.isRead && markAsRead(notif._id)}
                >
                    {!notif.isRead && (
                        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                    )}
                    
                    <div className="flex gap-4">
                        <div className="mt-1">{getTypeIcon(notif.type)}</div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white truncate">{notif.title}</h4>
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{notif.message}</p>
                            
                            <div className="flex items-center justify-between mt-3">
                                <span className="text-[10px] font-medium text-gray-500 italic">
                                    {new Date(notif.createdAt).toLocaleDateString()}
                                </span>
                                <div className="flex items-center gap-3">
                                    {notif.type === 'team' && pendingInvites.some(i => notif.message.includes(i.orgId?.name)) && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const invite = pendingInvites.find(i => notif.message.includes(i.orgId?.name));
                                                if (invite) handleAcceptInvite(invite._id, notif._id);
                                            }}
                                            disabled={!!acceptingId}
                                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50"
                                        >
                                            {acceptingId ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />}
                                            Accept
                                        </button>
                                    )}
                                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {notif.link && (
                                            <Link 
                                                href={notif.link} 
                                                onClick={onAction}
                                                className="text-indigo-400 hover:text-indigo-300 transition-colors"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </Link>
                                        )}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); deleteNotification(notif._id); }}
                                            className="text-gray-600 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
