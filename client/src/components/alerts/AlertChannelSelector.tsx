'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Check, Plus, Loader2, Slack, Hash, MessageSquare, Globe } from 'lucide-react';
import Link from 'next/link';
import api from '@/services/api';

interface AlertChannelSelectorProps {
  selectedChannels: string[];
  onChange: (ids: string[]) => void;
}

const typeIcons: any = {
  slack: Slack,
  discord: Hash,
  teams: MessageSquare,
  webhook: Globe,
};

export default function AlertChannelSelector({ selectedChannels, onChange }: AlertChannelSelectorProps) {
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/alert-channels');
        setChannels(res.data);
      } catch (err) {
        console.error('Failed to fetch channels for selector', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const toggleChannel = (id: string) => {
    if (selectedChannels.includes(id)) {
      onChange(selectedChannels.filter(c => c !== id));
    } else {
      onChange([...selectedChannels, id]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
        <Loader2 size={16} className="animate-spin text-indigo-600" />
        Loading alert channels...
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-dashed border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          No alert channels configured yet.
        </p>
        <Link
          href="/dashboard/alert-channels/new"
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          target="_blank"
        >
          <Plus size={14} />
          Create Alert Channel
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {channels.map((channel) => {
          const isSelected = selectedChannels.includes(channel._id);
          const Icon = typeIcons[channel.type] || Bell;

          return (
            <button
              key={channel._id}
              type="button"
              onClick={() => toggleChannel(channel._id)}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                  : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                  <Icon size={16} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold truncate max-w-[150px] leading-tight">
                    {channel.name}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider opacity-60">
                    {channel.type}
                  </div>
                </div>
              </div>
              
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 dark:border-gray-700'
              }`}>
                {isSelected && <Check size={12} strokeWidth={4} />}
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-gray-400">
          {selectedChannels.length} channel{selectedChannels.length !== 1 && 's'} selected
        </span>
        <Link
          href="/dashboard/alert-channels"
          className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          target="_blank"
        >
          Manage Channels &rarr;
        </Link>
      </div>
    </div>
  );
}
