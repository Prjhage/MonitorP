import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MonitorP | API & Heartbeat Monitoring",
  description: "The world's most reliable API monitoring platform for modern engineering teams.",
};

import { AuthProvider } from "@/context/AuthContext";
import { CacheProvider } from "@/context/CacheContext";
import { ToastProvider } from "@/context/ToastContext";
import { ConfirmProvider } from "@/context/ConfirmContext";
import DesktopOnly from "@/components/layout/DesktopOnly";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <CacheProvider>
            <ToastProvider>
              <ConfirmProvider>
                <DesktopOnly />
                <div className="mesh-bg" />
                {children}
              </ConfirmProvider>
            </ToastProvider>
          </CacheProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
