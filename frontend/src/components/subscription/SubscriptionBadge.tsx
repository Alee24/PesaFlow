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
                <div className={`relative bg-gray-900/90 text-white px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-2 cursor-pointer border border-white/5 backdrop-blur-md hover:scale-110 active:scale-95 transition-all duration-300`}>
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-1 rounded-full">
                        <Star className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-[10px] font-black tracking-widest text-white/90 uppercase">LIFETIME ACCESS</span>
                </div>
            </div>
        </div>
    );
};
