'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';

interface Subscription {
    id: string;
    plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    monthlyTxCount: number;
    txCountResetDate: string;
    isEnterprise: boolean;
    endDate?: string;
}

interface SubscriptionContextType {
    subscription: Subscription | null;
    loading: boolean;
    hasFeature: (feature: string) => boolean;
    getRemainingTransactions: () => number;
    canCreateBranch: () => boolean;
    refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within SubscriptionProvider');
    }
    return context;
};

// Feature access matrix (matches backend)
const FEATURE_ACCESS: Record<string, Record<string, boolean>> = {
    'invoices': {
        FREE: false,
        BASIC: true,
        PRO: true,
        ENTERPRISE: true
    },
    'withdrawals': {
        FREE: false,
        BASIC: false,
        PRO: true,
        ENTERPRISE: true
    },
    'team': {
        FREE: false,
        BASIC: false,
        PRO: true,
        ENTERPRISE: true
    },
    'analytics': {
        FREE: false,
        BASIC: false,
        PRO: true,
        ENTERPRISE: true
    },
    'reports': {
        FREE: false,
        BASIC: true,
        PRO: true,
        ENTERPRISE: true
    }
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSubscription = async () => {
        try {
            const response = await api.get('/subscription/status');
            setSubscription(response.data);
        } catch (error) {
            console.error('Failed to fetch subscription:', error);
            // Default to FREE if fetch fails
            setSubscription({
                id: 'default',
                plan: 'FREE',
                status: 'ACTIVE',
                monthlyTxCount: 0,
                txCountResetDate: new Date().toISOString(),
                isEnterprise: false
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscription();
    }, []);

    const hasFeature = (feature: string): boolean => {
        if (!subscription) return false;
        return FEATURE_ACCESS[feature]?.[subscription.plan] || false;
    };

    const getRemainingTransactions = (): number => {
        if (!subscription || subscription.plan !== 'BASIC') return Infinity;
        return Math.max(0, 100 - subscription.monthlyTxCount);
    };

    const canCreateBranch = (): boolean => {
        if (!subscription) return false;
        return subscription.plan === 'PRO' || subscription.plan === 'ENTERPRISE';
    };

    const refreshSubscription = async () => {
        await fetchSubscription();
    };

    return (
        <SubscriptionContext.Provider
            value={{
                subscription,
                loading,
                hasFeature,
                getRemainingTransactions,
                canCreateBranch,
                refreshSubscription
            }}
        >
            {children}
        </SubscriptionContext.Provider>
    );
};
