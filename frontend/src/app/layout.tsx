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
  maximumScale: 5,
  userScalable: true,
  themeColor: "#6366f1",
};

export const metadata: Metadata = {
  title: "Mpesa Connect | STK Push, CRM, Invoicing & POS Software",
  description: "The complete business management platform for automated M-Pesa STK push payments, customer relationship management (CRM), professional invoicing, and real-time reports.",
  keywords: "M-Pesa STK push, CRM software, automated invoicing, POS system, payment collection, business reports, M-Pesa integration, merchant software, receipt generation",
  openGraph: {
    title: "Mpesa Connect | STK Push, CRM, Invoicing & POS",
    description: "Automate your business with M-Pesa STK push payments, advanced CRM, invoicing, and real-time reports.",
    url: "https://mpesaconnect.co.ke",
    siteName: "Mpesa Connect",
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mpesa Connect | STK Push, CRM, Invoicing & POS",
    description: "Automate your business with M-Pesa STK push payments, advanced CRM, invoicing, and real-time reports.",
  },
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
};

import { Toaster } from 'react-hot-toast';
import { ToastProvider } from "@/contexts/ToastContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import Script from 'next/script';
import { LicenseGuard } from "@/components/license/LicenseGuard";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";

import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import { DynamicFavicon } from "@/components/DynamicFavicon";

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
        <GoogleAnalytics />
        <AnalyticsTracker />
        <DynamicFavicon />
        <Toaster position="top-right" />
        <ToastProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <ThemeProvider defaultTheme="system" storageKey="mpesa-connect-theme">
                {/* <LicenseGuard> */}
                {children}
                {/* </LicenseGuard> */}
              </ThemeProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </ToastProvider>
        <Script src="/pwa-register.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
