'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useSearchParams } from 'next/navigation';
import api from '@/services/api';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, User, Building, ArrowRight } from 'lucide-react';

function RegisterForm() {
    const searchParams = useSearchParams();
    const inviteToken = searchParams.get('inviteToken');
    const inviteEmail = searchParams.get('email');
    const orgName = searchParams.get('orgName');

    const [formData, setFormData] = useState({
        fullName: '',
        companyName: orgName || '',
        email: inviteEmail || '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth(); // We'll use login function to set user state after invite completion
    const { showToast } = useToast();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (inviteToken) {
                const { data } = await api.post('/auth/complete-invite', {
                    inviteToken,
                    fullName: formData.fullName,
                    password: formData.password
                });
                // Manually set user state (like login does)
                localStorage.setItem('user', JSON.stringify(data));
                window.location.href = '/dashboard';
                showToast(`Welcome to ${orgName}!`, 'success');
            } else {
                const { data } = await api.post('/auth/register', formData);
                localStorage.setItem('user', JSON.stringify(data));
                window.location.href = '/dashboard';
                showToast('Account created successfully!', 'success');
            }
        } catch (error: any) {
            console.error(error);
            showToast(error?.response?.data?.message || 'Registration failed.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0b]">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg glass-card p-10 relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600" />

                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/20">
                        <Shield className="w-8 h-8 text-blue-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {inviteToken ? 'Join Organization' : 'Create Account'}
                    </h1>
                    <p className="text-gray-400 text-center">
                        {inviteToken ? `You've been invited to join ${orgName}` : 'Join the network of reliable software companies'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 ml-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                name="fullName"
                                type="text"
                                value={formData.fullName}
                                onChange={handleChange}
                                className="premium-input pl-12"
                                placeholder="John Doe"
                                required
                                suppressHydrationWarning
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 ml-1">Company Name</label>
                        <div className="relative">
                            <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                name="companyName"
                                type="text"
                                value={formData.companyName}
                                onChange={handleChange}
                                className="premium-input pl-12"
                                placeholder="Acme Inc."
                                required
                                disabled={!!inviteToken}
                                suppressHydrationWarning
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-gray-300 ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="premium-input pl-12"
                                placeholder="name@company.com"
                                required
                                disabled={!!inviteToken}
                                suppressHydrationWarning
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="premium-input pl-12"
                                placeholder="••••••••"
                                required
                                suppressHydrationWarning
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="premium-button w-full flex items-center justify-center gap-2 group"
                        >
                            {isLoading ? 'Creating account...' : (inviteToken ? 'Accept Invite & Join' : 'Start Monitoring Now')}
                            {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </div>
                </form>

                <p className="mt-8 text-center text-gray-400 text-sm">
                    Already using our platform?{' '}
                    <Link href="/login" className="text-blue-500 hover:text-blue-400 font-medium transition-colors">
                        Sign In
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] text-gray-500 font-bold uppercase tracking-widest text-xs">
                Loading Registration...
            </div>
        }>
            <RegisterForm />
        </Suspense>
    );
}
