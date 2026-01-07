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
            gradient: 'from-gray-500 to-slate-600',
            label: 'Free Plan'
        },
        BASIC: {
            icon: Zap,
            gradient: 'from-blue-500 to-cyan-600',
            label: 'Basic Plan'
        },
        PRO: {
            icon: Crown,
            gradient: 'from-purple-500 to-pink-600',
            label: 'Pro Plan'
        },
        ENTERPRISE: {
            icon: Shield,
            gradient: 'from-indigo-500 to-purple-600',
            label: 'Enterprise'
        }
    };

    const config = planConfig[subscription.plan];
    const Icon = config.icon;

    return (
        <div className="fixed bottom-4 right-4 z-40 print:hidden">
            <div className={`bg-gradient-to-r ${config.gradient} text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 cursor-pointer hover:shadow-xl transition-all hover:scale-105`}>
                <Icon className="w-4 h-4" />
                <span className="text-sm font-semibold">{config.label}</span>
            </div>
        </div>
    );
};
