
'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';
import { Wallet, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';

export default function WalletPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWallet();
    }, []);

    const fetchWallet = async () => {
        try {
            const res = await api.get('/wallet');
            setStats(res.data);
        } catch (error) {
            console.error("Failed to load wallet", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex h-screen items-center justify-center">
                    <p className="text-gray-500">Loading Wallet...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!stats) {
        return (
            <DashboardLayout>
                <div className="p-8 text-center text-red-500">
                    Failed to load wallet info.
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                <header>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Startups Wallet</h1>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-indigo-600 text-white">
                        <div className="p-2">
                            <p className="text-indigo-100 text-sm mb-1">Available Balance</p>
                            <h2 className="text-3xl font-bold">{stats.currency} {Number(stats.balance).toLocaleString()}</h2>
                        </div>
                    </Card>

                    <Card>
                        <div className="p-2 flex items-center gap-4">
                            <div className="p-3 bg-red-100 text-red-600 rounded-full">
                                <TrendingDown className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Total Withdrawn</p>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">KES {stats.totalWithdrawn?.toLocaleString()}</h3>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="p-2 flex items-center gap-4">
                            <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Pending Withdrawals</p>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">KES {stats.pendingAmount?.toLocaleString()}</h3>
                            </div>
                        </div>
                    </Card>
                </div>

                <Card>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <ArrowLeftRight className="w-5 h-5 text-gray-500" /> Recent Transactions
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/5">
                                    <th className="py-3 px-4 text-gray-500">Type</th>
                                    <th className="py-3 px-4 text-gray-500">Amount</th>
                                    <th className="py-3 px-4 text-gray-500">Reference</th>
                                    <th className="py-3 px-4 text-gray-500">Status</th>
                                    <th className="py-3 px-4 text-gray-500">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentTransactions?.length === 0 ? (
                                    <tr><td colSpan={5} className="py-8 text-center text-gray-500">No transactions yet</td></tr>
                                ) : (
                                    stats.recentTransactions?.map((tx: any) => (
                                        <tr key={tx.id} className="border-b dark:border-gray-700">
                                            <td className="py-3 px-4 font-medium">{tx.type}</td>
                                            <td className={`py-3 px-4 font-bold ${tx.type === 'DEPOSIT' || tx.type === 'POS_SALE' ? 'text-green-600' : 'text-gray-900'}`}>
                                                {tx.amount}
                                            </td>
                                            <td className="py-3 px-4 text-gray-500">{tx.reference || '-'}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded text-xs ${tx.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                        tx.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
