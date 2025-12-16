
'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <header>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transactions</h1>
                    <p className="text-gray-500">History of all payments</p>
                </header>

                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b dark:border-gray-700">
                                    <th className="py-4 px-6 text-gray-500">Date</th>
                                    <th className="py-4 px-6 text-gray-500">Type</th>
                                    <th className="py-4 px-6 text-gray-500">Ref</th>
                                    <th className="py-4 px-6 text-gray-500">Amount</th>
                                    <th className="py-4 px-6 text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
                                ) : transactions.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-8 text-gray-500">No transactions found.</td></tr>
                                ) : (
                                    transactions.map((tx) => (
                                        <tr key={tx.id} className="border-b dark:border-gray-700">
                                            <td className="py-4 px-6">{new Date(tx.createdAt).toLocaleString()}</td>
                                            <td className="py-4 px-6">{tx.type}</td>
                                            <td className="py-4 px-6">{tx.reference || '-'}</td>
                                            <td className="py-4 px-6 font-medium">KES {tx.amount}</td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${tx.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
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
        </div>
    );
}
