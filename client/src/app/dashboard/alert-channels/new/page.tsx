'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/services/api';
import AlertChannelForm from '@/components/alerts/AlertChannelForm';

export default function NewAlertChannelPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await api.post('/alert-channels', data);
      router.push('/dashboard/alert-channels');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create alert channel');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTest = async (id: string) => {
    await api.post(`/alert-channels/${id}/test`);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Link
        href="/dashboard/alert-channels"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-medium mb-6 transition-colors"
      >
        <ChevronLeft size={20} />
        Back to Alert Channels
      </Link>

      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          New Alert Channel
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Complete the form below to connect a new notification service.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        <AlertChannelForm
          onSubmit={handleSubmit}
          onTest={handleTest}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
