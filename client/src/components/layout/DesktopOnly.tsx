'use client';

import React, { useEffect, useState } from 'react';
import { Monitor, Smartphone, Layout } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DesktopOnly() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkSize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        checkSize();
        window.addEventListener('resize', checkSize);
        return () => window.removeEventListener('resize', checkSize);
    }, []);

    // Lock body scroll when overlay is active
    useEffect(() => {
        if (isMobile) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobile]);

    if (!isMobile) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                backgroundColor: '#050505',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                overflow: 'hidden',
                touchAction: 'none',
            }}
        >
            {/* Background glows */}
            <div style={{ position: 'absolute', top: '-5%', left: '-5%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-5%', right: '-5%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '400px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '28px',
                    padding: '32px 24px',
                    textAlign: 'center',
                    boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
                    overflow: 'hidden',
                }}
            >
                {/* Inner glow */}
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% -10%, rgba(59,130,246,0.15), transparent)', pointerEvents: 'none' }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    {/* Icon */}
                    <div style={{ marginBottom: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <motion.div
                                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                style={{ position: 'absolute', inset: '-8px', background: 'rgba(59,130,246,0.2)', borderRadius: '50%', filter: 'blur(16px)' }}
                            />
                            <div style={{ position: 'relative', width: '80px', height: '80px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(59,130,246,0.3)' }}>
                                <Monitor size={38} color="white" strokeWidth={1.5} />
                            </div>
                        </div>
                    </div>

                    {/* Heading */}
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', marginBottom: '12px', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                        Desktop Experience Only
                    </h1>

                    {/* Description */}
                    <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
                        MonitorP is a professional engineering suite built for high-resolution displays. Please open it on a{' '}
                        <span style={{ color: '#60a5fa', fontWeight: 500 }}>Desktop or Laptop</span>.
                    </p>

                    {/* Device cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)', padding: '14px 16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Smartphone size={18} color="#6b7280" />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>Current Device</p>
                                <p style={{ fontSize: '14px', color: '#ffffff', fontWeight: 500, margin: 0 }}>Mobile / Tablet</p>
                            </div>
                            <div style={{ marginLeft: 'auto', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%', boxShadow: '0 0 8px rgba(239,68,68,0.6)', flexShrink: 0 }} />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(59,130,246,0.08)', padding: '14px 16px', borderRadius: '16px', border: '1px solid rgba(59,130,246,0.2)' }}>
                            <div style={{ width: '36px', height: '36px', background: 'rgba(59,130,246,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Layout size={18} color="#60a5fa" />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ fontSize: '11px', color: 'rgba(96,165,250,0.7)', margin: 0 }}>Required Device</p>
                                <p style={{ fontSize: '14px', color: '#ffffff', fontWeight: 500, margin: 0 }}>Desktop (1024px+)</p>
                            </div>
                            <div style={{ marginLeft: 'auto', width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px rgba(34,197,94,0.6)', flexShrink: 0 }} />
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ marginTop: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#374151' }} />
                        <span style={{ fontSize: '12px', color: '#4b5563' }}>MonitorP · Desktop Platform</span>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#374151' }} />
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
