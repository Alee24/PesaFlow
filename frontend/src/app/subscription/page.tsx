'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Check, Shield, Heart, Zap, Sparkles, Activity } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';

export default function SubscriptionPage() {
    const { subscription } = useSubscription();

    const unlockedFeatures = [
        {
            title: 'Unlimited POS & Branch Billing',
            description: 'Operate unlimited POS checkouts and branches. Split bills, apply discounts, and manage cashier registers with zero restrictions.'
        },
        {
            title: 'Full Analytics & Growth Diagnostics',
            description: 'Access the complete diagnostics panel. Real-time profit reports, transaction trends, and payment tracking are fully enabled.'
        },
        {
            title: 'Empathetic Invoicing & Records',
            description: 'Generate, send, and download unlimited professional digital invoices and transaction receipts with no count caps.'
        },
        {
            title: 'Dedicated Safaricom API Integrations',
            description: 'Directly plug in your private M-Pesa client credentials or shortcodes for absolute control over daily settlements.'
        },
        {
            title: 'Granular Cashier Roles & Permissions',
            description: 'Secure your operations with multiple employee logins, branch managers, cashiers, and customized roles.'
        },
        {
            title: 'Enterprise Uptime & Security Shields',
            description: 'Military-grade end-to-end encryption (AES-256) and daily redundant backups to ensure total business continuity.'
        }
    ];

    return (
        <DashboardLayout>
            <div className="max-w-[1200px] mx-auto px-4 py-8">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-[#087c46] mb-4">
                        <Sparkles className="w-8 h-8 animate-pulse" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white sm:text-4xl">
                        Operational Status & Billing
                    </h1>
                    <p className="mt-3 max-w-2xl mx-auto text-lg text-neutral-500 dark:text-neutral-400">
                        Enjoy the reassurance of an all-inclusive enterprise system with absolutely zero fees.
                    </p>
                </div>

                {/* Status Hero Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#087c46] to-emerald-800 text-white rounded-3xl p-8 sm:p-12 shadow-xl shadow-[#087c46]/10 mb-12">
                    <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] opacity-10"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800 mb-6">
                                <Shield className="w-4 h-4 text-emerald-400" />
                                <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Verified Operating License</span>
                            </div>
                            
                            <h2 className="text-3xl font-bold mb-4">Unlimited Enterprise Access</h2>
                            <p className="text-emerald-100/90 max-w-2xl text-base leading-relaxed">
                                Your account is registered on our **Lifetime Free Plan**. All premium features, data limits, and branch slots are 100% unlocked for your operations.
                            </p>
                        </div>
                        
                        <div className="flex-shrink-0 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center w-full md:w-auto min-w-[200px]">
                            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-200">Account Tier</span>
                            <div className="text-3xl font-black mt-1 mb-2 tracking-tight text-white">ENTERPRISE</div>
                            <span className="inline-flex items-center gap-1.5 text-xs text-green-300 bg-emerald-950/40 px-3 py-1 rounded-full font-bold">
                                <Activity className="w-3.5 h-3.5 animate-pulse" /> Lifetime Free
                            </span>
                        </div>
                    </div>
                </div>

                {/* Features Checklist Grid */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 sm:p-10 border border-neutral-200/50 dark:border-zinc-800/50 shadow-sm">
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-8 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-[#087c46]" /> Unlocked Capabilities
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                        {unlockedFeatures.map((feat, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="mt-1 flex-shrink-0">
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-[#087c46]">
                                        <Check className="w-5 h-5 font-bold" />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-neutral-900 dark:text-white text-base mb-1.5">{feat.title}</h4>
                                    <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">{feat.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Reassurance Footer */}
                <div className="mt-12 text-center max-w-2xl mx-auto">
                    <p className="text-neutral-400 dark:text-neutral-500 text-xs leading-relaxed">
                        Need local hosting or private self-hosted source code setup? Contact our support channels at <span className="font-semibold text-neutral-500">support@mpesaconnect.co.ke</span> for enterprise consulting and customized deployments.
                    </p>
                </div>
            </div>
        </DashboardLayout>
    );
}
