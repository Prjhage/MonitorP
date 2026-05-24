'use client';

import React, { useState, useEffect } from 'react';
import { Send, Save, AlertCircle, CheckCircle2, Terminal, ExternalLink } from 'lucide-react';
import ChannelTypePicker from './ChannelTypePicker';

interface AlertChannelFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onTest: (id: string) => Promise<void>;
  isSubmitting?: boolean;
}

export default function AlertChannelForm({ initialData, onSubmit, onTest, isSubmitting }: AlertChannelFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState(initialData?.type || 'slack');
  const [webhookUrl, setWebhookUrl] = useState(initialData?.webhookUrl || '');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name, type, webhookUrl });
  };

  const handleTest = async () => {
    if (!initialData?._id) return;
    setTestStatus('testing');
    try {
      await onTest(initialData._id);
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 3000);
    } catch (err: any) {
      setTestStatus('error');
      setTestError(err.message || 'Test failed');
    }
  };

  const getInstructions = () => {
    switch (type) {
      case 'slack':
        return (
          <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-lg text-sm border border-purple-100 dark:border-purple-800">
            <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">How to get your Slack webhook URL:</h4>
            <ol className="list-decimal list-inside space-y-1 text-purple-700 dark:text-purple-400">
              <li>Go to <a href="https://api.slack.com/apps" target="_blank" className="font-medium underline">api.slack.com/apps</a></li>
              <li>Create app &rarr; Incoming Webhooks &rarr; Activate</li>
              <li>Add New Webhook to Workspace</li>
              <li>Select channel &rarr; Copy Webhook URL</li>
            </ol>
          </div>
        );
      case 'discord':
        return (
          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-lg text-sm border border-indigo-100 dark:border-indigo-800">
            <h4 className="font-semibold text-indigo-800 dark:text-indigo-300 mb-2">How to get your Discord webhook URL:</h4>
            <ol className="list-decimal list-inside space-y-1 text-indigo-700 dark:text-indigo-400">
              <li>Open Discord channel settings (gear icon)</li>
              <li>Integrations &rarr; Webhooks &rarr; New Webhook</li>
              <li>Click "Copy Webhook URL"</li>
            </ol>
          </div>
        );
      case 'teams':
        return (
          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg text-sm border border-blue-100 dark:border-blue-800">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">How to get your Teams webhook URL:</h4>
            <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-400">
              <li>Open Teams channel &rarr; "..." &rarr; Connectors</li>
              <li>Incoming Webhook &rarr; Add/Configure</li>
              <li>Name it &rarr; Create &rarr; Copy URL</li>
            </ol>
          </div>
        );
      case 'webhook':
        return (
          <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-lg text-sm border border-emerald-100 dark:border-emerald-800">
            <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">Custom Webhook:</h4>
            <p className="text-emerald-700 dark:text-emerald-400">
              Any URL that accepts POST requests. PingForge sends a clean JSON payload compatible with Zapier, Make, n8n, etc.
            </p>
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          1. Select Channel Type
        </label>
        <ChannelTypePicker selected={type} onChange={setType} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              2. Name Your Channel
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engineering Slack #alerts"
              required
              className="w-full px-4 py-2 rounded-lg border dark:bg-gray-900 dark:border-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              3. Webhook URL
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              required
              className="w-full px-4 py-2 rounded-lg border dark:bg-gray-900 dark:border-gray-800"
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Instructions
          </label>
          {getInstructions()}
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t dark:border-gray-800">
        <div className="flex items-center gap-4">
          {initialData?._id && (
            <button
              type="button"
              onClick={handleTest}
              disabled={testStatus === 'testing'}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                testStatus === 'success' ? 'bg-emerald-500 text-white' :
                testStatus === 'error' ? 'bg-red-500 text-white' :
                'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {testStatus === 'idle' && <Send size={18} />}
              {testStatus === 'testing' && <Terminal size={18} className="animate-pulse" />}
              {testStatus === 'success' && <CheckCircle2 size={18} />}
              {testStatus === 'error' && <AlertCircle size={18} />}
              
              {testStatus === 'idle' && 'Test Channel'}
              {testStatus === 'testing' && 'Sending Test...'}
              {testStatus === 'success' && 'Test Sent!'}
              {testStatus === 'error' && 'Test Failed'}
            </button>
          )}
          {testStatus === 'error' && (
            <span className="text-sm text-red-500 font-medium">
              {testError}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all"
        >
          <Save size={18} />
          {isSubmitting ? 'Saving...' : 'Save Channel'}
        </button>
      </div>
    </form>
  );
}
