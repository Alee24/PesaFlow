
'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api'; // Assuming api is defined here or needs to be imported

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTx = async () => {
            try {
                const res = await api.get('/transactions');
                setTransactions(res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchTx();
    }, []);

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                <header>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
                    <p className="text-gray-500 text-sm">History of all payments</p>
                </header>

                <Card className="border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                    <th className="py-4 px-6 text-gray-500 font-semibold">Date</th>
                                    <th className="py-4 px-6 text-gray-500 font-semibold">Type</th>
                                    <th className="py-4 px-6 text-gray-500 font-semibold">Ref</th>
                                    <th className="py-4 px-6 text-gray-500 font-semibold text-right">Amount</th>
                                    <th className="py-4 px-6 text-gray-500 font-semibold text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} className="text-center py-12 text-gray-500">Loading transactions...</td></tr>
                                ) : transactions.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-12 text-gray-500">No transactions found.</td></tr>
                                ) : (
                                    transactions.map((tx) => (
                                        <tr key={tx.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="py-4 px-6 text-gray-700 dark:text-gray-300">{new Date(tx.createdAt).toLocaleString()}</td>
                                            <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">{tx.type}</td>
                                            <td className="py-4 px-6 font-mono text-xs text-gray-500">{tx.reference || '-'}</td>
                                            <td className="py-4 px-6 font-bold text-gray-900 dark:text-white text-right">KES {tx.amount}</td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                    tx.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {tx.status}
                                                </span>
                                            </td>
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
