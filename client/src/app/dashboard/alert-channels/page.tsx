'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Bell, MessageSquare, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import api from '@/services/api';
import AlertChannelCard from '@/components/alerts/AlertChannelCard';
import { useAuth } from '@/context/AuthContext';

export default function AlertChannelsPage() {
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAtLeast } = useAuth();

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const res = await api.get('/alert-channels');
      setChannels(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load alert channels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/alert-channels/${id}`);
      setChannels(channels.filter(c => c._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete channel');
    }
  };

  const handleTest = async (id: string) => {
    await api.post(`/alert-channels/${id}/test`);
  };


  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Bell className="text-indigo-600" size={32} />
            Alert Channels
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Configure where PingForge sends incident notifications.
          </p>
        </div>
        {isAtLeast('admin') && (
          <Link
            href="/dashboard/alert-channels/new"
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={20} />
            Add Alert Channel
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
          <p className="text-gray-500 font-medium">Loading your channels...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-6 rounded-2xl flex items-center gap-4 text-red-700 dark:text-red-400">
          <AlertTriangle size={24} />
          <p className="font-medium">{error}</p>
        </div>
      ) : channels.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-12 text-center">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="text-indigo-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Alert Channels Yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Connect Slack, Discord, or MS Teams to receive real-time alerts when your services go down.
          </p>
          {isAtLeast('admin') && (
            <Link
              href="/dashboard/alert-channels/new"
              className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              Create your first channel &rarr;
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map((channel) => (
            <AlertChannelCard
              key={channel._id}
              channel={channel}
              onDelete={handleDelete}
              onTest={handleTest}
              onEdit={(c) => {
                // In a real app, you'd navigate to an edit page or open a modal
                // For this implementation, we'll focus on the New page
              }}
            />
          ))}
        </div>
      )}

      <div className="mt-12 bg-gray-50 dark:bg-gray-800/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-4 text-indigo-600 dark:text-indigo-400">
          <Shield size={20} />
          <h3 className="font-bold">Security Tip</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          Your webhook URLs are sensitive information. PingForge encrypts them at rest using AES-256-CBC. 
          Never share your webhook URLs publicly as they can be used to send unauthorized messages to your team's workspace.
        </p>
      </div>
    </div>
  );
}
