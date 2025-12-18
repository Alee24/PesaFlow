
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingCart, DollarSign, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import axios from 'axios';

// Mock Data for Charts
const chartData = [
    { name: 'Mon', sales: 4000 },
    { name: 'Tue', sales: 3000 },
    { name: 'Wed', sales: 2000 },
    { name: 'Thu', sales: 2780 },
    { name: 'Fri', sales: 1890 },
    { name: 'Sat', sales: 2390 },
    { name: 'Sun', sales: 3490 },
];

// ... imports
import api from '@/lib/api';
import { format } from 'date-fns';

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [invoiceStats, setInvoiceStats] = useState<any>(null);
    const [period, setPeriod] = useState('month');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/auth/login');
            return;
        }
        setUser(JSON.parse(userData));
    }, [router]);

    useEffect(() => {
        if (user) fetchStats();
    }, [user, period]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const [res, resInv] = await Promise.all([
                api.get(`/dashboard/stats?period=${period}`),
                api.get('/dashboard/invoices-stats')
            ]);
            setStats(res.data);
            setInvoiceStats(resInv.data);
        } catch (error) {
            console.error("Failed to load stats", error);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    const { summary, chartData, transactions } = stats || {};

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Welcome Section */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard Overview</h1>
                        <p className="text-gray-500 text-sm">Welcome back, {user.email} ({user.role})</p>
                    </div>
                    <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
                        {['day', 'week', 'month', 'year'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${period === p
                                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                    {/* Card 1: Wallet Balance */}
                    <div className="rounded-xl overflow-hidden shadow-lg bg-indigo-600 text-white p-6 relative">
                        <div className="flex justify-between items-start z-10 relative">
                            <div>
                                <h3 className="text-sm font-medium opacity-80 uppercase tracking-wider">{user.role === 'ADMIN' ? 'System Liquidity' : 'Wallet Balance'}</h3>
                                <div className="mt-2 text-3xl font-bold">KES {Number(summary?.walletBalance || 0).toLocaleString()}</div>
                                <p className="text-xs opacity-75 mt-1">Available Funds</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                <DollarSign className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Income */}
                    <div className="rounded-xl overflow-hidden shadow-lg bg-emerald-600 text-white p-6 relative">
                        <div className="flex justify-between items-start z-10 relative">
                            <div>
                                <h3 className="text-sm font-medium opacity-80 uppercase tracking-wider">{user.role === 'ADMIN' ? 'Total GTV' : 'Total Income'}</h3>
                                <div className="mt-2 text-3xl font-bold">KES {Number(summary?.totalIncome || 0).toLocaleString()}</div>
                                <p className="text-xs opacity-75 mt-1">Gross Transaction Volume</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Withdrawals */}
                    <div className="rounded-xl overflow-hidden shadow-lg bg-rose-600 text-white p-6 relative">
                        <div className="flex justify-between items-start z-10 relative">
                            <div>
                                <h3 className="text-sm font-medium opacity-80 uppercase tracking-wider">Withdrawals</h3>
                                <div className="mt-2 text-3xl font-bold">KES {Number(summary?.totalWithdrawals || 0).toLocaleString()}</div>
                                <p className="text-xs opacity-75 mt-1">Total Payouts ({period})</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                <ArrowRight className="w-6 h-6 text-white rotate-45" />
                            </div>
                        </div>
                    </div>

                    {/* Card 4: Service Income / Fees */}
                    <div className="rounded-xl overflow-hidden shadow-lg bg-amber-500 text-white p-6 relative">
                        <div className="flex justify-between items-start z-10 relative">
                            <div>
                                <h3 className="text-sm font-medium opacity-80 uppercase tracking-wider">{user.role === 'ADMIN' ? 'Service Revenue' : 'Transaction Fees'}</h3>
                                <div className="mt-2 text-3xl font-bold">KES {Number(summary?.totalFeeIncome || 0).toLocaleString()}</div>
                                <p className="text-xs opacity-75 mt-1">{user.role === 'ADMIN' ? 'Net Platform Income' : 'Service Charges Paid'}</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                <ShoppingCart className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Invoice Stats Section */}
                {invoiceStats && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Invoice Analytics</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <span className="text-xs font-bold text-gray-500 uppercase">Paid Invoices</span>
                                <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">{invoiceStats.paid.count}</div>
                                <div className="text-xs text-green-600 font-medium">KES {Number(invoiceStats.paid.amount).toLocaleString()}</div>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <span className="text-xs font-bold text-gray-500 uppercase">Pending Invoices</span>
                                <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">{invoiceStats.pending.count}</div>
                                <div className="text-xs text-yellow-600 font-medium">KES {Number(invoiceStats.pending.amount).toLocaleString()}</div>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <span className="text-xs font-bold text-gray-500 uppercase">Overdue Invoices</span>
                                <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">{invoiceStats.overdue.count}</div>
                                <div className="text-xs text-red-600 font-medium">KES {Number(invoiceStats.overdue.amount).toLocaleString()}</div>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <span className="text-xs font-bold text-gray-500 uppercase">Cancelled</span>
                                <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">{invoiceStats.cancelled.count}</div>
                                <div className="text-xs text-gray-500 font-medium">KES {Number(invoiceStats.cancelled.amount).toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Chart Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Financial Overview</h3>
                    <div className="h-80 w-full">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-gray-400">Loading Chart...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorWithdrawal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(str) => str.slice(5)}
                                        dy={10}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `K${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
                                    />
                                    <Tooltip
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
                                                        {payload.map((entry: any, index: number) => (
                                                            <div key={index} className="flex items-center gap-2 text-xs mb-1">
                                                                <div
                                                                    className="w-2 h-2 rounded-full"
                                                                    style={{ backgroundColor: entry.color }}
                                                                />
                                                                <span className="text-gray-500 capitalize">{entry.name}:</span>
                                                                <span className="font-bold text-gray-900 dark:text-white">
                                                                    KES {Number(entry.value).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="income"
                                        name="Volume"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorIncome)"
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="withdrawal"
                                        name="Payouts"
                                        stroke="#f43f5e"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorWithdrawal)"
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="fees"
                                        name="Fees"
                                        stroke="#f59e0b"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorFees)"
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Recent Transactions Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Recent Transactions</h3>
                        <Link href="/transactions" className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-500">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold">Type</th>
                                    <th className="px-6 py-4 font-semibold">Reference</th>
                                    <th className="px-6 py-4 font-semibold text-right">Amount</th>
                                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {transactions && transactions.length > 0 ? (
                                    transactions.map((tx: any) => (
                                        <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4">{new Date(tx.createdAt).toLocaleString()}</td>
                                            <td className="px-6 py-4 font-medium">{tx.type}</td>
                                            <td className="px-6 py-4 font-mono text-xs">{tx.reference || tx.id.slice(0, 8)}</td>
                                            <td className={`px-6 py-4 text-right font-medium ${tx.type === 'WITHDRAWAL' ? 'text-red-500' : 'text-green-600'}`}>
                                                {tx.type === 'WITHDRAWAL' ? '-' : '+'} KES {Number(tx.amount).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                    tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                            No transactions found for this period.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

// Add these to global css if not present or rely on standard tailwind colors
// The gradients used are standard Tailwind: from-blue-500 to-indigo-600, etc.
