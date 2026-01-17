
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingCart, DollarSign, TrendingUp, Calendar, ArrowRight, Download } from 'lucide-react';
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Dashboard Overview</h1>
                        <p className="text-gray-500 text-xs sm:text-sm">Welcome back, {user.email} ({user.role})</p>
                    </div>
                    <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700 w-full sm:w-auto overflow-x-auto">
                        {['day', 'week', 'month', 'year'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md capitalize transition-colors ${period === p
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

                    {/* Card 1: Wallet Balance */}
                    <div className="rounded-xl overflow-hidden shadow-lg bg-indigo-600 text-white p-4 sm:p-6 relative">
                        <div className="flex justify-between items-start z-10 relative">
                            <div>
                                <h3 className="text-[10px] sm:text-sm font-medium opacity-80 uppercase tracking-wider">{user.role === 'ADMIN' ? 'System Liquidity' : 'Wallet Balance'}</h3>
                                <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold">KES {Number(summary?.walletBalance || 0).toLocaleString()}</div>
                                <p className="text-[10px] sm:text-xs opacity-75 mt-1">Available Funds <span className="text-[9px] opacity-60 ml-1">(Only M-Pesa)</span></p>
                            </div>
                            <div className="p-2 sm:p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Income */}
                    <div className="rounded-xl overflow-hidden shadow-lg bg-emerald-600 text-white p-4 sm:p-6 relative">
                        <div className="flex justify-between items-start z-10 relative">
                            <div>
                                <h3 className="text-[10px] sm:text-sm font-medium opacity-80 uppercase tracking-wider">{user.role === 'ADMIN' ? 'Total GTV' : 'Total Income'}</h3>
                                <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold">KES {Number(summary?.totalIncome || 0).toLocaleString()}</div>
                                <p className="text-[10px] sm:text-xs opacity-75 mt-1">Gross Transaction Volume</p>
                            </div>
                            <div className="p-2 sm:p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Withdrawals */}
                    <div className="rounded-xl overflow-hidden shadow-lg bg-rose-600 text-white p-4 sm:p-6 relative">
                        <div className="flex justify-between items-start z-10 relative">
                            <div>
                                <h3 className="text-[10px] sm:text-sm font-medium opacity-80 uppercase tracking-wider">Withdrawals</h3>
                                <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold">KES {Number(summary?.totalWithdrawals || 0).toLocaleString()}</div>
                                <p className="text-[10px] sm:text-xs opacity-75 mt-1">Total Payouts ({period})</p>
                            </div>
                            <div className="p-2 sm:p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-white rotate-45" />
                            </div>
                        </div>
                    </div>

                    {/* Card 4: Service Income / Fees */}
                    <div className="rounded-xl overflow-hidden shadow-lg bg-amber-500 text-white p-4 sm:p-6 relative">
                        <div className="flex justify-between items-start z-10 relative">
                            <div>
                                <h3 className="text-[10px] sm:text-sm font-medium opacity-80 uppercase tracking-wider">{user.role === 'ADMIN' ? 'Service Revenue' : 'Transaction Fees'}</h3>
                                <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold">KES {Number(summary?.totalFeeIncome || 0).toLocaleString()}</div>
                                <p className="text-[10px] sm:text-xs opacity-75 mt-1">{user.role === 'ADMIN' ? 'Net Platform Income' : 'Service Charges'}</p>
                            </div>
                            <div className="p-2 sm:p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* KRA VAT Statistics */}
                {summary?.vatEnabled && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">KRA VAT Liability</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">16% VAT on Sales ({period})</p>
                                    </div>
                                </div>

                                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-1">Total Sales (VAT Enabled)</p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                                            KES {Number(summary?.totalSalesWithVAT || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-1">VAT Collected (16%)</p>
                                        <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                                            KES {Number(summary?.totalVATCollected || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                                        <p className="text-xs text-red-600 dark:text-red-400 uppercase font-bold mb-1">Amount Owed to KRA</p>
                                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                            KES {Number(summary?.kraVATOwed || 0).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-red-500 dark:text-red-400 mt-1">Must be remitted to KRA</p>
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <p className="text-xs text-blue-800 dark:text-blue-300">
                                        <strong>Note:</strong> This calculation is based on Kenyan KRA tax laws (16% VAT).
                                        Only sales from products with VAT enabled are included.
                                        Ensure timely remittance to avoid penalties.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={async () => {
                                    try {
                                        const response = await api.get('/kra/vat-report', {
                                            responseType: 'blob',
                                            params: { period }
                                        });
                                        const url = window.URL.createObjectURL(new Blob([response.data]));
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.setAttribute('download', `KRA_VAT_Report_${new Date().toISOString().slice(0, 10)}.csv`);
                                        document.body.appendChild(link);
                                        link.click();
                                        link.remove();
                                    } catch (error) {
                                        console.error('Failed to download report', error);
                                        alert('Failed to download KRA report');
                                    }
                                }}
                                className="ml-4 flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Download iTax Report
                            </button>
                        </div>
                    </div>
                    </div>
                )}

            {/* Invoice Stats Section */}
            {invoiceStats && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Invoice Analytics</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase">Paid Invoices</span>
                            <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mt-1">{invoiceStats.paid.count}</div>
                            <div className="text-[10px] sm:text-xs text-green-600 font-medium truncate">KES {Number(invoiceStats.paid.amount).toLocaleString()}</div>
                        </div>
                        <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase">Pending Invoices</span>
                            <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mt-1">{invoiceStats.pending.count}</div>
                            <div className="text-[10px] sm:text-xs text-yellow-600 font-medium truncate">KES {Number(invoiceStats.pending.amount).toLocaleString()}</div>
                        </div>
                        <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase">Overdue Invoices</span>
                            <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mt-1">{invoiceStats.overdue.count}</div>
                            <div className="text-[10px] sm:text-xs text-red-600 font-medium truncate">KES {Number(invoiceStats.overdue.amount).toLocaleString()}</div>
                        </div>
                        <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase">Cancelled</span>
                            <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mt-1">{invoiceStats.cancelled.count}</div>
                            <div className="text-[10px] sm:text-xs text-gray-500 font-medium truncate">KES {Number(invoiceStats.cancelled.amount).toLocaleString()}</div>
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
                                        <td className="px-6 py-4 font-medium">
                                            <span className={`text-xs px-2 py-1 rounded-full ${tx.type === 'DEPOSIT_STK' ? 'bg-green-100 text-green-700' :
                                                tx.type === 'SALE_CASH' ? 'bg-blue-100 text-blue-700' :
                                                    tx.type === 'WITHDRAWAL' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {tx.type === 'DEPOSIT_STK' ? 'M-Pesa' :
                                                    tx.type === 'SALE_CASH' ? 'Cash' :
                                                        tx.type === 'WITHDRAWAL' ? 'Withdrawal' :
                                                            tx.type.replace('_', ' ')}
                                            </span>
                                        </td>
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
        </DashboardLayout >
    );
}

// Add these to global css if not present or rely on standard tailwind colors
// The gradients used are standard Tailwind: from-blue-500 to-indigo-600, etc.
