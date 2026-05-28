'use client';

import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Crown, Zap, Shield, Gift } from 'lucide-react';

export const SubscriptionBadge: React.FC = () => {
    const { subscription, loading } = useSubscription();

    if (loading || !subscription) return null;

    const planConfig = {
        FREE: {
            icon: Gift,
            gradient: 'from-emerald-500 via-green-600 to-teal-600',
            label: '1 Year Promotion',
            border: 'border-green-400/30'
        },
        BASIC: {
            icon: Zap,
            gradient: 'from-blue-500 via-indigo-600 to-cyan-600',
            label: 'Basic Plan',
            border: 'border-blue-400/30'
        },
        PRO: {
            icon: Crown,
            gradient: 'from-purple-500 via-fuchsia-600 to-pink-600',
            label: 'Pro Access',
            border: 'border-purple-400/30'
        },
        ENTERPRISE: {
            icon: Shield,
            gradient: 'from-slate-800 via-gray-900 to-black',
            label: 'Enterprise',
            border: 'border-gray-500/30'
        }
    };

    const config = (planConfig as any)[subscription.plan] || planConfig.FREE;
    const Icon = config.icon;

    return (
        <div className="fixed bottom-6 right-6 z-40 print:hidden animate-in slide-in-from-bottom-5 duration-500">
            <div className={`relative group`}>
                <div className={`absolute -inset-1 bg-gradient-to-r ${config.gradient} rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse`}></div>
                <div className={`relative bg-gradient-to-r ${config.gradient} text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 cursor-pointer border ${config.border} backdrop-blur-md hover:scale-105 active:scale-95 transition-all duration-300 ring-4 ring-white/10`}>
                    <div className="bg-white/20 p-1 rounded-full">
                        <Icon className="w-3.5 h-3.5 drop-shadow-md" />
                    </div>
                    <div className="flex flex-col leading-tight">
                        <span className="text-[10px] uppercase font-bold tracking-tighter opacity-80">Membership</span>
                        <span className="text-xs font-black tracking-wide drop-shadow-sm">{config.label}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
