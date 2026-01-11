import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Mpesa Connect - Complete Business Management Platform",
  description: "Advanced POS, Inventory Management, M-Pesa Integration & Merchant Verification System",
  manifest: "/manifest.json",
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mpesa Connect",
  },
  applicationName: "Mpesa Connect",
  themeColor: "#6366f1",
};

import { Toaster } from 'react-hot-toast';
import { ToastProvider } from "@/contexts/ToastContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import Script from 'next/script';
import { LicenseGuard } from "@/components/license/LicenseGuard";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";

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
        <Toaster position="top-right" />
        <ToastProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <ThemeProvider defaultTheme="system" storageKey="mpesa-connect-theme">
                <LicenseGuard>
                  {children}
                </LicenseGuard>
              </ThemeProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </ToastProvider>
        <Script src="/pwa-register.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
