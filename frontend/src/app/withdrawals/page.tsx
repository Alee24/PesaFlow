'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, DollarSign, Calendar } from 'lucide-react';

export default function WithdrawalsPage() {
    const { showToast } = useToast();
    const [balance, setBalance] = useState('0.00');
    const [stats, setStats] = useState<any>(null);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [amount, setAmount] = useState('');
    const [mpesaNumber, setMpesaNumber] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch wallet stats from new endpoint
            const statsRes = await api.get('/wallet/stats');
            setStats(statsRes.data);
            setBalance(statsRes.data.balance);

            // Fetch history (still useful to keep separate or rely on stats recent)
            const res = await api.get('/withdrawals');
            setWithdrawals(res.data);
        } catch (e) {
            console.error(e);
            // showToast("Failed to load wallet data", "error"); // Optional: don't spam if just initial load
        }
    };

    const handleWithdraw = async () => {
        if (!amount || !mpesaNumber) {
            showToast("Please fill in all fields", "error");
            return;
        }

        setLoading(true);
        try {
            await api.post('/withdrawals', { amount, mpesaNumber });
            setAmount('');
            showToast('Withdrawal requested successfully!', 'success');
            fetchData();
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to request withdrawal', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                <header>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Wallet & Withdrawals</h1>
                    <p className="text-gray-500">Manage your earnings and payouts</p>
                </header>

                {/* Wallet Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Current Balance */}
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <Wallet className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">{stats?.currency || 'KES'}</span>
                            </div>
                            <p className="text-indigo-100 text-sm font-medium">Available Balance</p>
                            <h3 className="text-3xl font-bold mt-1 tracking-tight">
                                {Number(balance).toLocaleString()}
                            </h3>
                            <p className="text-xs text-indigo-200 mt-2 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Updated just now
                            </p>
                        </div>
                        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4 group-hover:scale-110 transition-transform">
                            <Wallet className="w-32 h-32" />
                        </div>
                    </div>

                    {/* Total Withdrawn */}
                    <Card className="p-6 border-l-4 border-l-green-500">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 rounded-full text-green-600">
                                <ArrowUpRight className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Total Withdrawn</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {Number(stats?.totalWithdrawn || 0).toLocaleString()}
                                </h3>
                            </div>
                        </div>
                    </Card>

                    {/* Pending Withdrawals */}
                    <Card className="p-6 border-l-4 border-l-yellow-500">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-50 rounded-full text-yellow-600">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Pending Payouts</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {Number(stats?.pendingAmount || 0).toLocaleString()}
                                </h3>
                            </div>
                        </div>
                    </Card>

                    {/* Last Withdrawal */}
                    <Card className="p-6 border-l-4 border-l-blue-500">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Last Withdrawal</p>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                                    {stats?.lastWithdrawal ? new Date(stats.lastWithdrawal.createdAt).toLocaleDateString() : 'N/A'}
                                </h3>
                                <p className="text-xs text-gray-400">
                                    {stats?.lastWithdrawal ? `KES ${Number(stats.lastWithdrawal.amount).toLocaleString()}` : '-'}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Request Form */}
                    <div className="lg:col-span-1">
                        <Card title="Request New Withdrawal" className="sticky top-24">
                            <div className="space-y-6">
                                <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                                    <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-1">Important Note</h4>
                                    <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed">
                                        Withdrawals are processed within 24 hours. Minimum withdrawal amount is KES 100.
                                        Ensure your M-Pesa number is correct.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <Input
                                        label="Amount to Withdraw"
                                        placeholder="Min 100"
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        className="text-lg font-semibold"
                                    />
                                    <Input
                                        label="M-Pesa Number"
                                        placeholder="2547..."
                                        type="tel"
                                        value={mpesaNumber}
                                        onChange={e => setMpesaNumber(e.target.value)}
                                    />

                                    <div className="pt-2">
                                        <Button
                                            className="w-full h-12 text-lg shadow-lg shadow-indigo-200 dark:shadow-none transition-transform active:scale-95"
                                            onClick={handleWithdraw}
                                            isLoading={loading}
                                        >
                                            Request Payout
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* History Table */}
                    <div className="lg:col-span-2">
                        <Card title="Transaction History">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                            <th className="p-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">Date</th>
                                            <th className="p-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">Transaction ID</th>
                                            <th className="p-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">Amount</th>
                                            <th className="p-4 text-xs uppercase tracking-wider text-gray-500 font-semibold text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {withdrawals.length === 0 ? (
                                            <tr><td colSpan={4} className="text-center py-12 text-gray-500">No withdrawal history found.</td></tr>
                                        ) : (
                                            withdrawals.map((w) => (
                                                <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                                        {new Date(w.createdAt).toLocaleDateString()}
                                                        <span className="block text-xs text-gray-400">{new Date(w.createdAt).toLocaleTimeString()}</span>
                                                    </td>
                                                    <td className="p-4 text-sm font-mono text-gray-500">
                                                        {w.id.slice(0, 8)}...
                                                    </td>
                                                    <td className="p-4 font-medium text-gray-900 dark:text-white">
                                                        KES {Number(w.amount).toLocaleString()}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                            ${w.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                                w.status === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                            }`}>
                                                            {w.status.toLowerCase()}
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
        </DashboardLayout>
    );
}
