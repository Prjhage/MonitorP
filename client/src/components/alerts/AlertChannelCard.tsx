'use client';

import React, { useState } from 'react';
import { Slack, Hash, MessageSquare, Globe, Trash2, Edit2, Play, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AlertChannelCardProps {
  channel: any;
  onEdit: (channel: any) => void;
  onDelete: (id: string) => void;
  onTest: (id: string) => Promise<void>;
}

const typeConfig = {
  slack: { icon: Slack, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  discord: { icon: Hash, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
  teams: { icon: MessageSquare, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  webhook: { icon: Globe, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

export default function AlertChannelCard({ channel, onEdit, onDelete, onTest }: AlertChannelCardProps) {
  const { isAtLeast } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const config = (typeConfig as any)[channel.type] || typeConfig.webhook;
  const Icon = config.icon;

  const handleTest = async () => {
    setTestStatus('testing');
    try {
      await onTest(channel._id);
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 3000);
    } catch (err) {
      setTestStatus('error');
      setTimeout(() => setTestStatus('idle'), 3000);
    }
  };

  const confirmDelete = () => {
    if (isDeleting) {
      onDelete(channel._id);
    } else {
      setIsDeleting(true);
      setTimeout(() => setIsDeleting(false), 3000);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${config.color}`}>
            <Icon size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
              {channel.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 capitalize">
              <span>{channel.type}</span>
              <span>•</span>
              <span className={channel.isActive ? 'text-emerald-500 font-medium' : 'text-gray-400'}>
                {channel.isActive ? 'Active' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {isAtLeast('admin') && (
            <>
              <button
                onClick={handleTest}
                disabled={testStatus === 'testing'}
                className={`p-2 rounded-lg transition-colors ${
                  testStatus === 'success' ? 'bg-emerald-500 text-white' :
                  testStatus === 'error' ? 'bg-red-500 text-white' :
                  'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                }`}
                title="Send Test Alert"
              >
                {testStatus === 'idle' && <Play size={18} fill="currentColor" />}
                {testStatus === 'testing' && <Play size={18} className="animate-pulse" />}
                {testStatus === 'success' && <CheckCircle2 size={18} />}
                {testStatus === 'error' && <AlertCircle size={18} />}
              </button>
              
              <button
                onClick={() => onEdit(channel)}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                title="Edit Channel"
              >
                <Edit2 size={18} />
              </button>
              
              <button
                onClick={confirmDelete}
                className={`p-2 rounded-lg transition-all ${
                  isDeleting 
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30' 
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                }`}
                title={isDeleting ? "Click again to confirm" : "Delete Channel"}
              >
                <Trash2 size={18} className={isDeleting ? 'animate-bounce' : ''} />
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400">
        <span>Assigned to: {channel.monitorCount || 0} monitors</span>
        {channel.lastAlertAt && (
          <span>Last alert: {new Date(channel.lastAlertAt).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
}
