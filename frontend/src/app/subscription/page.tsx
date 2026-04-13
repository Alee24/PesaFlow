'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Check, Star, Shield, Zap, Info, Globe, ShoppingCart, Store, Users, ShieldCheck } from 'lucide-react';

export default function SubscriptionPage() {
    const router = useRouter();
    
    const featureSections = [
        {
            title: 'Interbank Core',
            icon: <Globe className="w-6 h-6" />,
            features: [
                'Full KCB Buni API Integration',
                'Equity Jenga Integration',
                'Secure Interbank Transfers',
                'Real-time Settlement Hooks'
            ]
        },
        {
            title: 'Payment Hub',
            icon: <Zap className="w-6 h-6" />,
            features: [
                'M-Pesa STK Push Integration',
                'Automatic C2B Reconciliations',
                'Bulk B2C Disbursements',
                'Till/Paybill Management'
            ]
        },
        {
            title: 'Smart Inventory',
            icon: <ShoppingCart className="w-6 h-6" />,
            features: [
                'Multi-branch Stock Tracking',
                'Low stock automated alerts',
                'Barcode/SKU Management',
                'Supplier Purchase Orders'
            ]
        },
        {
            title: 'POS Experience',
            icon: <Store className="w-6 h-6" />,
            features: [
                'High-speed Kiosk Interface',
                'Digital & Physical Receipts',
                'Split Payments Support',
                'Offline Resilience'
            ]
        },
        {
            title: 'CRM & Loyalty',
            icon: <Users className="w-6 h-6" />,
            features: [
                'Automated Customer Segments',
                'Loyalty Points System',
                'Campaign Management',
                'Lifetime Value Tracking'
            ]
        },
        {
            title: 'Enterprise Tools',
            icon: <ShieldCheck className="w-6 h-6" />,
            features: [
                'Branch Manager Roles',
                'Role-Based Access Control',
                'System Audit Logs',
                'Custom White-labeling'
            ]
        }
    ];

    return (
        <DashboardLayout>
            <div className="max-w-[1400px] mx-auto px-4 py-16">

                {/* Anniversary / Freedom Header */}
                <div className="text-center mb-24 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/10 blur-[100px] rounded-full" />
                    
                    <span className="inline-flex items-center px-6 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-black text-xs mb-8 uppercase tracking-[0.3em] animate-pulse">
                        <Star className="w-4 h-4 mr-2" /> Mpesa Connect Freedom v2
                    </span>
                    
                    <h1 className="text-6xl md:text-8xl font-black text-gray-900 dark:text-white leading-[0.9] mb-8">
                        The Suite is <br/>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                            100% Free Forever.
                        </span>
                    </h1>
                    
                    <p className="max-w-4xl mx-auto text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                        We've unlocked every premium module. No tiered pricing, no monthly bills, no limits. 
                        Empowering Kenyan commerce with the most powerful financial suite ever built.
                    </p>
                </div>

                {/* The "Free" Hero Card */}
                <div className="bg-white dark:bg-gray-800 rounded-[40px] p-8 md:p-16 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-gray-800 relative overflow-hidden mb-24 group hover:border-indigo-500/30 transition-all duration-700">
                    <div className="absolute top-0 right-0 p-12">
                        <Zap className="w-64 h-64 text-indigo-500/5 rotate-12 group-hover:scale-110 transition-transform duration-1000" />
                    </div>

                    <div className="relative z-10 grid grid-cols-1 xl:grid-cols-3 gap-16 items-center">
                        <div className="xl:col-span-2">
                            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-12">Everything is Included</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {featureSections.map((section, i) => (
                                    <div key={i}>
                                        <div className="flex items-center gap-3 mb-4 text-indigo-600">
                                            {section.icon}
                                            <h4 className="font-black text-lg uppercase tracking-wider">{section.title}</h4>
                                        </div>
                                        <ul className="space-y-3">
                                            {section.features.map((feat, j) => (
                                                <li key={j} className="flex items-center gap-3 text-gray-600 dark:text-gray-400 text-sm font-medium">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                    {feat}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-[32px] p-10 text-center border border-gray-100 dark:border-gray-800 relative z-20">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-green-500/50">
                                ACTIVE LIFETIME
                            </div>
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.4em] mb-4">Subscription Package</h3>
                            <div className="text-7xl font-black text-gray-900 dark:text-white mb-4">FREE</div>
                            <p className="text-indigo-600 font-black text-lg mb-10 tracking-tight">Full Enterprise Tier Activated</p>
                            
                            <div className="space-y-5 mb-10">
                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-green-500" />
                                        <span className="text-gray-500 font-bold">Monthly Bill</span>
                                    </div>
                                    <span className="text-green-600 font-black text-lg">KES 0</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <ShoppingCart className="w-4 h-4 text-green-500" />
                                        <span className="text-gray-500 font-bold">POS/Inventory</span>
                                    </div>
                                    <span className="text-indigo-600 font-black">UNLIMITED</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-green-500" />
                                        <span className="text-gray-500 font-bold">Bank Channels</span>
                                    </div>
                                    <span className="text-indigo-600 font-black">UNLOCKED</span>
                                </div>
                            </div>

                            <Button 
                                onClick={() => router.push('/dashboard')} 
                                className="w-full py-8 text-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-[20px] transition-all hover:scale-[1.02] shadow-2xl"
                            >
                                Enter Dashboard
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <button 
                        onClick={() => router.push('/support')}
                        className="text-gray-500 text-sm font-black uppercase tracking-widest hover:text-indigo-600 transition-colors"
                    >
                        Questions? Contact Engineering Support
                    </button>
                </div>
            </div>
            <Toaster position="top-center" />
        </DashboardLayout>
    );
}
