'use client';

import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Crown, Zap, Shield, Gift, Star } from 'lucide-react';

export const SubscriptionBadge: React.FC = () => {
    const { loading } = useSubscription();

    if (loading) return null;

    return (
        <div className="fixed bottom-6 right-6 z-40 print:hidden animate-in slide-in-from-bottom-5 duration-500">
            <div className={`relative group`}>
                <div className={`absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse`}></div>
                <div className={`relative bg-gray-900 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 cursor-pointer border border-white/10 backdrop-blur-md hover:scale-105 active:scale-95 transition-all duration-300 ring-4 ring-white/5`}>
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-1.5 rounded-full">
                        <Star className="w-3.5 h-3.5 drop-shadow-md text-white" />
                    </div>
                    <div className="flex flex-col leading-tight">
                        <span className="text-[9px] uppercase font-black tracking-[0.2em] text-purple-400">Mpesa Connect Freedom</span>
                        <span className="text-xs font-black tracking-wide drop-shadow-sm bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">LIFETIME ACCESS</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
