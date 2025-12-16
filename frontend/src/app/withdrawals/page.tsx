
'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api'; // Assuming an API utility is available at this path

export default function WithdrawalsPage() {
    const [balance, setBalance] = useState('0.00');
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [amount, setAmount] = useState('');
    const [mpesaNumber, setMpesaNumber] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch wallet balance (Assuming we have an endpoint, or user endpoint includes it)
            // For now, let's assume /api/auth/me or similar returns it, OR we add a wallet endpoint.
            // Let's use a quick wallet fetch if available, else 0.
            // Actually, we can fetch withdrawals first.
            const res = await api.get('/withdrawals');
            setWithdrawals(res.data);
            // Optionally fetch balance if there's a dedicated endpoint or it's part of user data
            // For now, let's mock a balance or assume it's fetched elsewhere.
            // If balance is part of user data, you'd fetch user data and extract it.
            // Example: const userRes = await api.get('/user/me'); setBalance(userRes.data.walletBalance);
        } catch (e) {
            console.error(e);
        }
    };

    const handleWithdraw = async () => {
        setLoading(true);
        try {
            await api.post('/withdrawals', { amount, mpesaNumber });
            setAmount('');
            alert('Withdrawal requested successfully!');
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to request withdrawal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <header>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Withdrawals</h1>
                    <p className="text-gray-500">Manage your funds</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card title="Request Withdrawal" className="md:col-span-1 h-fit">
                        <div className="space-y-4">
                            <div className="p-4 bg-indigo-50 rounded-lg">
                                <p className="text-sm text-indigo-800">Available Balance</p>
                                <p className="text-2xl font-bold text-indigo-900">KES {balance}</p>
                            </div>

                            <Input
                                label="Amount to Withdraw"
                                placeholder="Min KES 100"
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                            />
                            <Input
                                label="M-Pesa Number"
                                placeholder="2547..."
                                type="tel"
                                value={mpesaNumber}
                                onChange={e => setMpesaNumber(e.target.value)}
                            />

                            <Button className="w-full" onClick={handleWithdraw} isLoading={loading}>Request Payout</Button>
                        </div>
                    </Card>

                    <Card title="Withdrawal History" className="md:col-span-2">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b dark:border-gray-700">
                                        <th className="p-4 text-gray-500">Date</th>
                                        <th className="p-4 text-gray-500">Amount</th>
                                        <th className="p-4 text-gray-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {withdrawals.length === 0 ? (
                                        <tr><td colSpan={3} className="text-center py-8 text-gray-500">No withdrawals yet.</td></tr>
                                    ) : (
                                        withdrawals.map((w) => (
                                            <tr key={w.id} className="border-b dark:border-gray-700">
                                                <td className="p-4">{new Date(w.createdAt).toLocaleDateString()}</td>
                                                <td className="p-4">KES {w.amount}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${w.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                            w.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                                'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {w.status}
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
        </div>
    );
}
