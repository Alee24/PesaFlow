'use client';

import React, { createContext, useContext } from 'react';

// ============================================================
// ALL SUBSCRIPTION LOGIC REMOVED — APP IS 100% FREE
// ============================================================

interface SubscriptionContextType {
    subscription: null;
    loading: false;
    hasFeature: (feature: string) => boolean;
    getRemainingTransactions: () => number;
    canCreateBranch: () => boolean;
    refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
    subscription: null,
    loading: false,
    hasFeature: () => true,
    getRemainingTransactions: () => Infinity,
    canCreateBranch: () => true,
    refreshSubscription: async () => {},
});

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <SubscriptionContext.Provider value={{
            subscription: null,
            loading: false,
            hasFeature: () => true,
            getRemainingTransactions: () => Infinity,
            canCreateBranch: () => true,
            refreshSubscription: async () => {},
        }}>
            {children}
        </SubscriptionContext.Provider>
    );
};
