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
    const { hasFeature, subscription } = useSubscription();

    if (hasFeature(feature)) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    return <UpgradePrompt feature={feature} currentPlan={subscription?.plan || 'FREE'} />;
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

// Transaction Limit Warning Component
export const TransactionLimitWarning: React.FC = () => {
    const { subscription, getRemainingTransactions } = useSubscription();
    const router = useRouter();
    const remaining = getRemainingTransactions();

    if (subscription?.plan !== 'BASIC' || remaining > 20) {
        return null;
    }

    const percentage = (remaining / 100) * 100;
    const isLow = percentage < 20;

    return (
        <div className={`rounded-lg p-4 mb-6 ${isLow ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'} border`}>
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isLow ? 'bg-red-100 dark:bg-red-900/40' : 'bg-yellow-100 dark:bg-yellow-900/40'}`}>
                    <svg className={`w-5 h-5 ${isLow ? 'text-red-600' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h4 className={`font-semibold ${isLow ? 'text-red-900 dark:text-red-100' : 'text-yellow-900 dark:text-yellow-100'} mb-1`}>
                        {isLow ? 'Transaction Limit Almost Reached' : 'Transaction Limit Warning'}
                    </h4>
                    <p className={`text-sm ${isLow ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'} mb-3`}>
                        You have <strong>{remaining}</strong> transactions remaining this month ({percentage.toFixed(0)}% left)
                    </p>
                    <button
                        onClick={() => router.push('/subscription')}
                        className={`text-sm font-semibold ${isLow ? 'text-red-600 hover:text-red-700' : 'text-yellow-600 hover:text-yellow-700'} underline`}
                    >
                        Upgrade to PRO for unlimited transactions →
                    </button>
                </div>
            </div>
        </div>
    );
};
