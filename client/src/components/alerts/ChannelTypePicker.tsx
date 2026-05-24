'use client';

import React from 'react';
import { Slack, Hash, MessageSquare, Globe, LucideIcon } from 'lucide-react';

interface ChannelType {
  id: 'slack' | 'discord' | 'teams' | 'webhook';
  name: string;
  icon: LucideIcon;
  color: string;
}

const types: ChannelType[] = [
  { id: 'slack', name: 'Slack', icon: Slack, color: '#4A154B' },
  { id: 'discord', name: 'Discord', icon: Hash, color: '#5865F2' },
  { id: 'teams', name: 'MS Teams', icon: MessageSquare, color: '#4B5563' },
  { id: 'webhook', name: 'Webhook', icon: Globe, color: '#10B981' },
];

interface ChannelTypePickerProps {
  selected: string;
  onChange: (type: 'slack' | 'discord' | 'teams' | 'webhook') => void;
}

export default function ChannelTypePicker({ selected, onChange }: ChannelTypePickerProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {types.map((type) => {
        const Icon = type.icon;
        const isSelected = selected === type.id;

        return (
          <button
            key={type.id}
            type="button"
            onClick={() => onChange(type.id)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
              isSelected
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-md'
                : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700'
            }`}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3 text-white"
              style={{ backgroundColor: type.color }}
            >
              <Icon size={24} />
            </div>
            <span className={`font-semibold ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>
              {type.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
