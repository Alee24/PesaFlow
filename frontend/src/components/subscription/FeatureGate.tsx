'use client';

import React from 'react';

interface FeatureGateProps {
    feature: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({ feature, children }) => {
    // Software is fully free for now, bypass all gates
    return <>{children}</>;
};

export const TransactionLimitWarning: React.FC = () => {
    // No transaction limits
    return null;
};
