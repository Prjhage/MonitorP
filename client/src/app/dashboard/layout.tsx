'use client';

import Sidebar from '@/components/layout/Sidebar';
import { TourProvider } from '@/context/TourContext';
import TourGuide from '@/components/dashboard/TourGuide';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TourProvider>
      <div className="h-screen flex bg-[#030303] relative overflow-hidden">
        {/* Animated Background */}
        <div className="bg-animate">
          <div className="mesh-circle w-[600px] h-[600px] bg-blue-600/20 -top-[200px] -left-[100px]" />
          <div className="mesh-circle w-[500px] h-[500px] bg-purple-600/20 -bottom-[100px] -right-[100px] animation-delay-2000" />
          <div className="noise-overlay" />
        </div>

        <Sidebar />
        <main className="flex-1 overflow-y-auto relative z-10">
          {children}
        </main>
        <TourGuide />
      </div>
    </TourProvider>
  );
}
