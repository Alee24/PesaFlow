'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';
import {
    Wallet, TrendingUp, TrendingDown, ArrowUpRight,
    ArrowDownLeft, History, CreditCard, Download, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

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
                <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        <p className="text-gray-500 animate-pulse">Loading secure wallet...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!stats) {
        return (
            <DashboardLayout>
                <div className="p-8 text-center text-red-500">
                    Failed to load wallet info. Please try again.
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 pb-12">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                            Merchant Wallet
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage automated M-Pesa collections and payouts</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Link href="/withdrawals" className="flex-1 sm:flex-none">
                            <Button variant="outline" size="sm" className="w-full gap-1 sm:gap-2 text-[10px] sm:text-sm h-9 sm:h-10">
                                <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> History
                            </Button>
                        </Link>
                        <Link href="/withdrawals" className="flex-1 sm:flex-none">
                            <Button size="sm" className="w-full gap-1 sm:gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] sm:text-sm h-9 sm:h-10">
                                <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Withdraw
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* 1. Main Balance Card (Credit Card Style) */}
                    <div className="lg:col-span-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] p-8 text-white shadow-2xl">
                        {/* Abstract Background Shapes */}
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 h-48 w-48 rounded-full bg-white/10 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 h-32 w-32 rounded-full bg-black/10 blur-2xl"></div>

                        <div className="relative z-10 flex flex-col justify-between h-full min-h-[180px]">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-indigo-100/80 text-sm font-medium tracking-wider uppercase mb-1">Available Balance</p>
                                    <h2 className="text-4xl font-bold tracking-tight text-white mb-2">
                                        <span className="text-2xl opacity-70 mr-1">{stats.currency}</span>
                                        {Number(stats.balance).toLocaleString()}
                                    </h2>
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/20 text-[10px] font-medium text-white/90 backdrop-blur-md">
                                        <ShieldCheck className="w-3 h-3" />
                                        <span>Only M-Pesa Payments</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                                    <Wallet className="w-8 h-8 text-white" />
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-end">
                                <div>
                                    <p className="text-indigo-200 text-xs uppercase tracking-wider">Wallet Status</p>
                                    <p className="font-medium text-emerald-300 flex items-center gap-1 mt-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                        Active
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-indigo-200 text-xs uppercase tracking-wider">Account Type</p>
                                    <p className="font-medium text-white mt-1">Merchant</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Secondary Metrics */}
                    <div className="lg:col-span-2 grid grid-cols-1 xs:grid-cols-2 gap-4 sm:gap-6">
                        {/* Total Withdrawn */}
                        <Card className="flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-rose-500 p-4 sm:p-6">
                            <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                <ArrowDownLeft className="w-16 sm:w-24 h-16 sm:h-24 text-rose-600" />
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-sm font-medium uppercase tracking-wider">Total Withdrawn</p>
                                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">
                                    <span className="text-xs sm:text-base text-gray-400 font-normal mr-1">KES</span>
                                    {stats.totalWithdrawn?.toLocaleString()}
                                </h3>
                            </div>
                            <div className="mt-3 sm:mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[10px] sm:text-sm">
                                <span className="text-rose-600 font-medium flex items-center gap-1">
                                    <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Payouts
                                </span>
                            </div>
                        </Card>

                        {/* Pending Withdrawals */}
                        <Card className="flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-amber-500 p-4 sm:p-6">
                            <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                <History className="w-16 sm:w-24 h-16 sm:h-24 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-sm font-medium uppercase tracking-wider">Pending Processing</p>
                                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">
                                    <span className="text-xs sm:text-base text-gray-400 font-normal mr-1">KES</span>
                                    {stats.pendingAmount?.toLocaleString()}
                                </h3>
                            </div>
                            <div className="mt-3 sm:mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[10px] sm:text-sm">
                                <span className="text-amber-600 font-medium flex items-center gap-1">
                                    <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Reserved
                                </span>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Transactions Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                <ArrowUpRight className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Transactions</h3>
                                <p className="text-xs text-gray-500">Latest funds in/out of your wallet</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                            Export CSV
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-700 text-xs uppercase text-gray-500 font-semibold bg-gray-50/50 dark:bg-gray-900/20">
                                    <th className="py-4 px-6">Transaction Detail</th>
                                    <th className="py-4 px-6">Date & Time</th>
                                    <th className="py-4 px-6">Reference</th>
                                    <th className="py-4 px-6 text-right">Amount</th>
                                    <th className="py-4 px-6 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {stats.recentTransactions?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <History className="w-12 h-12 mb-3 opacity-20" />
                                                <p>No wallet activity recorded yet.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    stats.recentTransactions?.map((tx: any) => (
                                        <tr key={tx.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${tx.type === 'DEPOSIT_STK' ? 'bg-green-100 text-green-600' :
                                                        tx.type === 'WITHDRAWAL' ? 'bg-rose-100 text-rose-600' :
                                                            'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {tx.type === 'DEPOSIT_STK' ? <ArrowDownLeft className="w-4 h-4" /> :
                                                            tx.type === 'WITHDRAWAL' ? <ArrowUpRight className="w-4 h-4" /> :
                                                                <CreditCard className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {tx.type === 'DEPOSIT_STK' ? 'M-Pesa Payment' :
                                                                tx.type === 'WITHDRAWAL' ? 'Funds Withdrawal' :
                                                                    tx.type.replace('_', ' ')}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {tx.type === 'DEPOSIT_STK' ? 'Funds Received' : 'Payout'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-gray-500">
                                                {new Date(tx.createdAt).toLocaleDateString()}
                                                <span className="text-xs text-gray-400 block mt-0.5">
                                                    {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600">
                                                    {tx.reference || 'N/A'}
                                                </span>
                                            </td>
                                            <td className={`py-4 px-6 text-right font-bold ${tx.type === 'WITHDRAWAL' ? 'text-rose-600' : 'text-emerald-600'
                                                }`}>
                                                {tx.type === 'WITHDRAWAL' ? '-' : '+'}
                                                {Number(tx.amount).toLocaleString()}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                    tx.status === 'FAILED' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                        'bg-amber-100 text-amber-700 border border-amber-200'
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
                </div>
            </div>
        </DashboardLayout>
    );
}
