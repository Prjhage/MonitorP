'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronDown, HelpCircle, Activity, Globe, Zap, Bell, ShieldCheck, Heart, ArrowLeft, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const faqs = [
    {
        question: "How does MonitorP work?",
        answer: "MonitorP works by periodically sending pings to your APIs and websites from multiple global regions. We measure response times, status codes, and verify response bodies against your custom assertions. If we detect a failure, we immediately notify you via your chosen alert channels.",
        icon: <Globe className="w-5 h-5 text-blue-500" />
    },
    {
        question: "Is it feasible for large-scale enterprise use?",
        answer: "Absolutely. MonitorP is built on a scalable, cloud-native architecture capable of handling thousands of monitors per account. We offer regional failover, high-frequency pings (down to 30 seconds), and team collaboration features designed for production-grade engineering environments.",
        icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />
    },
    {
        question: "What is Heartbeat monitoring?",
        answer: "Heartbeat monitoring is for internal tasks like cron jobs or background scripts that can't be reached by external pings. Instead, your job sends a 'heartbeat' signal to MonitorP when it finishes. If we don't hear from your job within the expected timeframe, we alert you immediately.",
        icon: <Heart className="w-5 h-5 text-pink-500" />
    },
    {
        question: "How reliable are the alerts?",
        answer: "Our alerting engine uses staggered verification. If a monitor fails, we re-verify from another region before sounding the alarm. This prevents 'false positives' while ensuring you're the first to know the exact second a real incident occurs.",
        icon: <Bell className="w-5 h-5 text-amber-500" />
    },
    {
        question: "Can I customize my status pages?",
        answer: "Yes, every MonitorP account comes with public status pages. You can customize them with your company logo, brand colors, and choose exactly which monitors to display to your customers to build trust through transparency.",
        icon: <Zap className="w-5 h-5 text-purple-500" />
    },
    {
        question: "How secure is my data?",
        answer: "Security is our top priority. All sensitive data like custom headers or auth tokens are encrypted at rest. Our monitoring infrastructure is isolated, and we never touch your actual production data—only the endpoints you tell us to watch.",
        icon: <Shield className="w-5 h-5 text-indigo-500" />
    }
];

export default function FAQPage() {
    const { user } = useAuth();
    const [openIndex, setOpenIndex] = React.useState<number | null>(0);
    const [scrolled, setScrolled] = React.useState(false);
    const [dots, setDots] = React.useState<{ top: number, left: number, delay: number, duration: number }[]>([]);

    React.useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        setDots([...Array(15)].map(() => ({
            top: Math.random() * 100,
            left: Math.random() * 100,
            delay: Math.random() * 5,
            duration: 3 + Math.random() * 4
        })));
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen relative overflow-hidden bg-background">
            {/* Animated Background */}
            <div className="fixed inset-0 z-0 bg-background">
                <div className="bg-grid opacity-40" />
                <div className="mesh-circle w-[1000px] h-[1000px] bg-blue-600/10 -top-[300px] -left-[200px]" />
                <div className="mesh-circle w-[800px] h-[800px] bg-indigo-600/10 bottom-[0px] right-[0px] animation-delay-5000" />

                {dots.map((dot, i) => (
                    <div
                        key={i}
                        className="blink-dot"
                        style={{
                            top: `${dot.top}%`,
                            left: `${dot.left}%`,
                            animationDelay: `${dot.delay}s`,
                            animationDuration: `${dot.duration}s`,
                            opacity: 0.15
                        }}
                    />
                ))}
                <div className="noise-overlay opacity-[0.02]" />
            </div>

            <div className="relative z-10">
                {/* Navigation */}
                <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled
                        ? 'bg-background/80 backdrop-blur-xl border-white/10 py-4 shadow-2xl'
                        : 'bg-transparent border-transparent py-6'
                    }`}>
                    <div className="flex items-center justify-between px-10 max-w-7xl mx-auto">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative flex items-center justify-center">
                                <div className="absolute inset-0 bg-blue-500 blur-[25px] opacity-40 group-hover:opacity-80 transition-opacity duration-500 rounded-xl animate-pulse" />
                                <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center border border-white/40 shadow-[0_0_25px_rgba(59,130,246,0.6)] transform group-hover:scale-110 transition-all duration-500">
                                    <Shield className="text-white w-6 h-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
                                </div>
                            </div>
                            <span className="text-xl font-black tracking-tighter text-white group-hover:text-blue-400 transition-colors">Monitor<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">P</span></span>
                        </Link>

                        <div className="flex items-center gap-6">
                            <Link href="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-2 group">
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
                            </Link>
                            {user ? (
                                <Link href="/dashboard/profile" className="relative group/user flex items-center justify-center">
                                    <div className="absolute inset-0 bg-indigo-500 blur-[25px] opacity-30 group-hover/user:opacity-70 transition-opacity duration-500 rounded-full animate-pulse" />
                                    <div className="relative w-10 h-10 rounded-full bg-[#111] p-[0.5px] border border-white/30 flex items-center justify-center overflow-hidden transition-all duration-500 group-hover/user:scale-110 group-hover/user:border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                                        <User className="w-5 h-5 text-gray-400 group-hover/user:text-white transition-colors" />
                                    </div>
                                </Link>
                            ) : (
                                <Link href="/login" className="premium-button py-2 px-6 text-sm">Sign In</Link>
                            )}
                        </div>
                    </div>
                </nav>

                <div className="max-w-4xl mx-auto px-6 pt-40 pb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-sm font-medium mb-6">
                            <HelpCircle className="w-4 h-4" />
                            <span>Support Center</span>
                        </div>
                        <h1 className="text-5xl font-black text-white mb-6 tracking-tight">Frequently Asked <span className="gradient-text">Questions</span></h1>
                        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                            Everything you need to know about MonitorP. Can't find what you're looking for? Reach out to our team.
                        </p>
                    </motion.div>

                    {/* FAQ Accordion Grid */}
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`glass-card overflow-hidden transition-all duration-500 border-white/5 ${openIndex === index ? 'bg-white/[0.04] border-white/10 ring-1 ring-blue-500/20' : 'hover:bg-white/[0.02]'}`}
                            >
                                <button
                                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                    className="w-full px-8 py-6 flex items-center justify-between text-left group"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 ${openIndex === index ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/5 text-gray-500 group-hover:text-gray-300'}`}>
                                            {faq.icon}
                                        </div>
                                        <span className={`text-lg font-bold transition-colors ${openIndex === index ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                            {faq.question}
                                        </span>
                                    </div>
                                    <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform duration-500 ${openIndex === index ? 'rotate-180 text-blue-400' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {openIndex === index && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                        >
                                            <div className="px-8 pb-8 pl-[4.5rem]">
                                                <p className="text-gray-400 leading-relaxed text-base font-medium">
                                                    {faq.answer}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>

                    {/* Call to Action */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="mt-24 p-12 glass-card text-center border-blue-500/20 bg-blue-500/[0.02] relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full translate-y-20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        <h3 className="text-2xl font-bold text-white mb-4 relative z-10">Still have more questions?</h3>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto relative z-10">We're here to help you build the most reliable APIs in the world.</p>
                        <Link href="/register" className="premium-button relative z-10 inline-block">
                            Contact Sales Support
                        </Link>
                    </motion.div>
                </div>

                {/* Footer Link Restoration */}
                <footer className="py-20 px-6 border-t border-white/5">
                    <div className="max-w-7xl mx-auto flex flex-col items-center">
                        <div className="flex items-center gap-3 mb-8">
                            <Shield className="text-blue-500 w-6 h-6" />
                            <span className="text-lg font-black tracking-tighter text-white">MonitorP</span>
                        </div>
                        <div className="flex items-center gap-8 mb-8 text-sm text-gray-500 font-medium">
                            <Link href="/" className="hover:text-white transition-colors">Home</Link>
                            <Link href="/faq" className="hover:text-white transition-colors text-blue-400 underline underline-offset-4">FAQ</Link>
                            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                        </div>
                        <div className="text-sm text-gray-500">
                            &copy; 2026 MonitorP SaaS. All rights reserved.
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
