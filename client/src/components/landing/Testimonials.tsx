'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
    {
        quote: "PingForge alerted us 40 minutes before our client noticed the API was down. Saved us from a massive client escalation and a potential contract termination.",
        name: "Rahul Sharma",
        role: "CTO",
        company: "TechSphere Solutions",
        city: "Pune",
        initials: "RS",
        gradient: "from-blue-500 to-indigo-600",
    },
    {
        quote: "We were managing 20 client APIs on Excel sheets. PingForge replaced all of that in one afternoon. Now clients trust us completely because of the status page.",
        name: "Priya Mehta",
        role: "Founder",
        company: "DevBridge Agency",
        city: "Bangalore",
        initials: "PM",
        gradient: "from-purple-500 to-pink-600",
    },
    {
        quote: "The heartbeat monitor caught our backup job failure on day 3. Before PingForge we had a 3-week data loss incident. Never again.",
        name: "Karan Patel",
        role: "Senior Developer",
        company: "FinEdge Software",
        city: "Mumbai",
        initials: "KP",
        gradient: "from-emerald-500 to-teal-600",
    },
    {
        quote: "Setup took 5 minutes. First alert came within an hour — our staging environment was broken and nobody knew. PingForge caught it before production.",
        name: "Sneha Joshi",
        role: "DevOps Lead",
        company: "CloudCraft Solutions",
        city: "Hyderabad",
        initials: "SJ",
        gradient: "from-amber-500 to-orange-600",
    },
    {
        quote: "We share the public status page with every client during onboarding. Clients love it — complete transparency builds trust we never had before.",
        name: "Amit Verma",
        role: "Project Manager",
        company: "TechNova Systems",
        city: "Delhi",
        initials: "AV",
        gradient: "from-cyan-500 to-blue-600",
    },
    {
        quote: "As a solo freelancer managing 8 client websites PingForge is the first thing I recommend. I look professional and clients feel safe knowing I'm watching.",
        name: "Nisha Kumar",
        role: "Freelance Developer",
        company: "Independent",
        city: "Chennai",
        initials: "NK",
        gradient: "from-rose-500 to-red-600",
    },
];

function Stars() {
    return (
        <div className="flex gap-0.5 mb-4">
            {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
        </div>
    );
}

export default function Testimonials() {
    return (
        <section className="relative py-28 px-6 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4">Social Proof</p>
                    <h2 className="text-4xl font-black text-white tracking-tight mb-4">
                        Trusted by software teams across India
                    </h2>
                    <p className="text-gray-500 text-lg max-w-xl mx-auto">
                        From solo freelancers to growing agencies — here is what they say
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-5">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 }}
                            whileHover={{ y: -6, scale: 1.02 }}
                            className="glass-card p-7 flex flex-col group relative overflow-hidden"
                        >
                            {/* Subtle gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem]" />

                            <Stars />

                            <p className="text-gray-400 text-sm leading-relaxed flex-1 mb-6 italic">
                                "{t.quote}"
                            </p>

                            <div className="border-t border-white/[0.05] pt-5 flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-lg`}>
                                    {t.initials}
                                </div>
                                <div>
                                    <p className="text-white font-black text-sm">{t.name}</p>
                                    <p className="text-gray-600 text-xs font-bold">
                                        {t.role} · {t.company} · {t.city}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
