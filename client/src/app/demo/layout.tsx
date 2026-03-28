import React from 'react';
import DemoBanner from '@/components/demo/DemoBanner';

export default function DemoLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#050508]">
            <DemoBanner />
            {children}
        </div>
    );
}
