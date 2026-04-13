'use client';

import React, { useState } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Database, RefreshCw, X } from 'lucide-react';

export const SubscriptionDebugBox: React.FC = () => {
    const { subscription, loading, refreshSubscription } = useSubscription();
    const [isOpen, setIsOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        await refreshSubscription();
        setTimeout(() => setRefreshing(false), 500);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-20 right-4 bg-black text-white p-3 rounded-lg shadow-lg hover:bg-gray-800 transition z-50 print:hidden"
                title="Show Subscription Status"
            >
                <Database className="w-5 h-5" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-20 right-4 bg-black text-white p-4 rounded-lg shadow-2xl z-50 w-80 print:hidden">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    <h3 className="font-bold text-sm">Subscription Status (DB)</h3>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {loading ? (
                <div className="text-xs text-gray-400">Loading...</div>
            ) : subscription ? (
                <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Plan:</span>
                        <span className="font-bold text-green-400">{subscription.plan}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className="font-bold text-blue-400">{subscription.status}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Tx Count:</span>
                        <span className="font-mono">{subscription.monthlyTxCount || 0}/100</span>
                    </div>
                    {subscription.endDate && (
                        <div className="flex justify-between">
                            <span className="text-gray-400">Expires:</span>
                            <span className="font-mono text-xs">
                                {new Date(subscription.endDate).toLocaleDateString()}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-gray-400">Enterprise:</span>
                        <span className={subscription.isEnterprise ? 'text-purple-400' : 'text-gray-500'}>
                            {subscription.isEnterprise ? 'Yes' : 'No'}
                        </span>
                    </div>

                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="w-full mt-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-2 rounded flex items-center justify-center gap-2 text-xs transition"
                    >
                        <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Refreshing...' : 'Refresh from DB'}
                    </button>
                </div>
            ) : (
                <div className="text-xs text-red-400">No subscription found</div>
            )}

            <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
                💡 Click refresh if DB was updated manually
            </div>
        </div>
    );
};
