'use client';

import React from 'react';
import { Lock, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface FeatureGateProps {
    feature: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({ feature, children, fallback }) => {
    return <>{children}</>;
};

interface UpgradePromptProps {
    feature: string;
    currentPlan: string;
    requiredPlan?: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({ feature, currentPlan, requiredPlan }) => {
    const router = useRouter();

    const getRequiredPlan = () => {
        if (requiredPlan) return requiredPlan;

        // Determine minimum plan for feature
        if (feature === 'withdrawals' || feature === 'team' || feature === 'analytics') {
            return 'PRO';
        }
        return 'BASIC';
    };

    const minPlan = getRequiredPlan();

    return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
            <div className="max-w-md w-full text-center">
                {/* Icon */}
                <div className="mb-6 flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full blur-xl opacity-50"></div>
                        <div className="relative bg-white dark:bg-gray-800 rounded-full p-6 shadow-2xl">
                            <Lock className="w-16 h-16 text-purple-500" />
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                    Upgrade Required
                </h2>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                    Unlock <span className="font-semibold text-purple-600 dark:text-purple-400">{feature}</span> by upgrading to {minPlan} plan
                </p>

                {/* Details */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 mb-6 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Current Plan</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{currentPlan}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Required Plan</span>
                        <span className="font-semibold text-purple-600 dark:text-purple-400">{minPlan}</span>
                    </div>
                </div>

                {/* CTA Button */}
                <button
                    onClick={() => router.push('/subscription')}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold py-4 px-8 rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                >
                    <TrendingUp className="w-5 h-5" />
                    Upgrade to {minPlan}
                </button>

                {/* Additional info */}
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                    Unlock all features and grow your business
                </p>
            </div>
        </div>
    );
};

// Transaction Limit Warning Component (Bypassed)
export const TransactionLimitWarning: React.FC = () => {
    return null;
};
