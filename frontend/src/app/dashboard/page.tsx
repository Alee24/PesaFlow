
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import {
    ShoppingCart, DollarSign, TrendingUp, ArrowRight, Download, Package,
    FileText, Zap, CreditCard, Plus, ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import api from '@/lib/api';

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [invoiceStats, setInvoiceStats] = useState<any>(null);
    const [period, setPeriod] = useState('month');
    const [loading, setLoading] = useState(true);
    const [resendStatus, setResendStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/auth/login');
            return;
        }
        const parsed = JSON.parse(userData);
        setUser(parsed);

        api.get('/auth/me')
            .then(res => {
                if (res.data?.user) {
                    setUser(res.data.user);
                    localStorage.setItem('user', JSON.stringify(res.data.user));
                }
            })
            .catch(() => { });
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

    const statCards = [
        {
            label: user.role === 'ADMIN' ? 'System Liquidity' : 'Wallet Balance',
            value: `KES ${Number(summary?.walletBalance || 0).toLocaleString()}`,
            sub: 'Available funds',
            icon: DollarSign,
            trend: null,
            color: 'emerald',
        },
        {
            label: user.role === 'ADMIN' ? 'Total GTV' : 'Total Income',
            value: `KES ${Number(summary?.totalIncome || 0).toLocaleString()}`,
            sub: `Gross volume (${period})`,
            icon: TrendingUp,
            trend: '+12.4%',
            trendUp: true,
            color: 'blue',
        },
        {
            label: 'Withdrawals',
            value: `KES ${Number(summary?.totalWithdrawals || 0).toLocaleString()}`,
            sub: `Total payouts (${period})`,
            icon: ArrowRight,
            trend: null,
            color: 'rose',
        },
        {
            label: user.role === 'ADMIN' ? 'Service Revenue' : 'Transaction Fees',
            value: `KES ${Number(summary?.totalFeeIncome || 0).toLocaleString()}`,
            sub: user.role === 'ADMIN' ? 'Net platform income' : 'Service charges',
            icon: Activity,
            trend: null,
            color: 'amber',
        },
    ];

    const colorMap: Record<string, { bg: string; icon: string; text: string; border: string }> = {
        emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/10', icon: 'text-emerald-600 dark:text-emerald-400', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-900/30' },
        blue: { bg: 'bg-blue-50 dark:bg-blue-900/10', icon: 'text-blue-600 dark:text-blue-400', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-900/30' },
        rose: { bg: 'bg-rose-50 dark:bg-rose-900/10', icon: 'text-rose-600 dark:text-rose-400', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-100 dark:border-rose-900/30' },
        amber: { bg: 'bg-amber-50 dark:bg-amber-900/10', icon: 'text-amber-600 dark:text-amber-400', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-900/30' },
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 pb-8">

                {/* Email Verification Banner */}
                {!user.emailVerified && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex gap-3">
                            <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center shrink-0">
                                <span className="text-lg">⚠️</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Verify your email address</h4>
                                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                                    Please verify within <strong>24 hours</strong> to keep your account active.
                                </p>
                                {resendStatus.message && (
                                    <p className={`text-xs mt-1.5 font-medium ${resendStatus.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
                                        {resendStatus.message}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            disabled={isResending}
                            onClick={async () => {
                                setIsResending(true);
                                try {
                                    const response = await api.post('/auth/resend-verification');
                                    setResendStatus({ type: 'success', message: response.data.message || 'Verification link sent!' });
                                } catch (err: any) {
                                    setResendStatus({ type: 'error', message: err.response?.data?.error || 'Failed to resend. Try again.' });
                                } finally { setIsResending(false); }
                            }}
                            className="shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                            {isResending ? 'Sending...' : 'Resend Link'}
                        </button>
                    </div>
                )}

                {/* Header row */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user.name?.split(' ')[0] || 'there'} 👋
                        </h1>
                        <p className="text-sm text-zinc-500 mt-0.5">Here's what's happening with your business today.</p>
                    </div>

                    {/* Period Selector */}
                    <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 gap-0.5">
                        {['day', 'week', 'month', 'year'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${period === p
                                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'New Sale', href: '/pos', icon: ShoppingCart, color: 'bg-emerald-500 hover:bg-emerald-600' },
                        { label: 'Create Invoice', href: '/invoices/new', icon: FileText, color: 'bg-blue-500 hover:bg-blue-600' },
                        { label: 'STK Push', href: '/wallet', icon: Zap, color: 'bg-violet-500 hover:bg-violet-600' },
                        { label: 'Withdraw', href: '/withdrawals', icon: CreditCard, color: 'bg-amber-500 hover:bg-amber-600' },
                    ].map((action) => (
                        <Link
                            key={action.label}
                            href={action.href}
                            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95 ${action.color}`}
                        >
                            <action.icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{action.label}</span>
                            <span className="sm:hidden">{action.label.split(' ')[0]}</span>
                        </Link>
                    ))}
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((card, i) => {
                        const colors = colorMap[card.color];
                        return (
                            <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{card.label}</p>
                                    <div className={`w-8 h-8 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center`}>
                                        <card.icon className={`w-4 h-4 ${colors.icon}`} />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-zinc-900 dark:text-white leading-none mb-1">
                                    {loading ? <span className="text-zinc-300 dark:text-zinc-700">—</span> : card.value}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <p className="text-xs text-zinc-400">{card.sub}</p>
                                    {card.trend && (
                                        <span className={`inline-flex items-center text-[10px] font-semibold ${card.trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {card.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                            {card.trend}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Chart + Invoice Stats Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Revenue Chart - 2/3 width */}
                    <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Revenue Overview</h3>
                                <p className="text-xs text-zinc-400 mt-0.5">Income vs. Payouts over time</p>
                            </div>
                        </div>
                        <div className="h-56">
                            {loading ? (
                                <div className="h-full flex items-center justify-center text-zinc-400 text-sm">Loading chart...</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorWithdrawal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 11, fill: '#a1a1aa' }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(str) => str?.slice?.(5) || str}
                                            dy={8}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: '#a1a1aa' }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                                            width={40}
                                        />
                                        <Tooltip
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl shadow-xl border border-zinc-100 dark:border-zinc-700">
                                                            <p className="text-xs font-semibold text-zinc-700 dark:text-white mb-2">{label}</p>
                                                            {payload.map((entry: any, index: number) => (
                                                                <div key={index} className="flex items-center gap-2 text-xs mb-1">
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                                    <span className="text-zinc-500">{entry.name}:</span>
                                                                    <span className="font-semibold text-zinc-900 dark:text-white">KES {Number(entry.value).toLocaleString()}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" activeDot={{ r: 4, strokeWidth: 0 }} />
                                        <Area type="monotone" dataKey="withdrawal" name="Payouts" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorWithdrawal)" activeDot={{ r: 4, strokeWidth: 0 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Invoice Stats - 1/3 width */}
                    {invoiceStats && (
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Invoices</h3>
                                <Link href="/invoices" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium">View all →</Link>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { label: 'Paid', count: invoiceStats.paid.count, amount: invoiceStats.paid.amount, color: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
                                    { label: 'Pending', count: invoiceStats.pending.count, amount: invoiceStats.pending.amount, color: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' },
                                    { label: 'Overdue', count: invoiceStats.overdue.count, amount: invoiceStats.overdue.amount, color: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' },
                                    { label: 'Cancelled', count: invoiceStats.cancelled.count, amount: invoiceStats.cancelled.amount, color: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500' },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.color}`}>{item.label}</span>
                                            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{item.count}</span>
                                        </div>
                                        <span className="text-xs text-zinc-500 font-medium">KES {Number(item.amount).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <Link
                                    href="/invoices/new"
                                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    New Invoice
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* KRA VAT Section */}
                {summary?.vatEnabled && (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2.5 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                                        <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">KRA VAT Liability</h3>
                                        <p className="text-xs text-zinc-400">16% VAT on enabled sales ({period})</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3.5">
                                        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">Sales (VAT Enabled)</p>
                                        <p className="text-lg font-bold text-zinc-900 dark:text-white">KES {Number(summary?.totalSalesWithVAT || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3.5">
                                        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">VAT Collected (16%)</p>
                                        <p className="text-lg font-bold text-amber-600 dark:text-amber-400">KES {Number(summary?.totalVATCollected || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg p-3.5">
                                        <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wide mb-1">Amount Owed to KRA</p>
                                        <p className="text-lg font-bold text-red-600 dark:text-red-400">KES {Number(summary?.kraVATOwed || 0).toLocaleString()}</p>
                                        <p className="text-[10px] text-red-400 mt-0.5">Must be remitted to KRA</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={async () => {
                                    try {
                                        const response = await api.get('/kra/vat-report', { responseType: 'blob', params: { period } });
                                        const url = window.URL.createObjectURL(new Blob([response.data]));
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.setAttribute('download', `KRA_VAT_Report_${new Date().toISOString().slice(0, 10)}.csv`);
                                        document.body.appendChild(link);
                                        link.click();
                                        link.remove();
                                    } catch { alert('Failed to download KRA report'); }
                                }}
                                className="ml-4 shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                            >
                                <Download className="w-3.5 h-3.5" />
                                iTax Report
                            </button>
                        </div>
                    </div>
                )}

                {/* Recent Transactions */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Recent Transactions</h3>
                            <p className="text-xs text-zinc-400 mt-0.5">Latest activity on your account</p>
                        </div>
                        <Link href="/transactions" className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                            View all <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500 uppercase text-[10px] tracking-wider">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">Date</th>
                                    <th className="px-5 py-3 font-semibold">Type</th>
                                    <th className="px-5 py-3 font-semibold hidden sm:table-cell">Reference</th>
                                    <th className="px-5 py-3 font-semibold text-right">Amount</th>
                                    <th className="px-5 py-3 font-semibold text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                                {transactions && transactions.length > 0 ? (
                                    transactions.map((tx: any) => (
                                        <tr key={tx.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-5 py-3.5 text-xs text-zinc-500">{new Date(tx.createdAt).toLocaleString()}</td>
                                            <td className="px-5 py-3.5">
                                                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${tx.type === 'DEPOSIT_STK' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' :
                                                    tx.type === 'SALE_CASH' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' :
                                                        tx.type === 'WITHDRAWAL' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                                                            'bg-zinc-100 dark:bg-zinc-800 text-zinc-600'
                                                    }`}>
                                                    {tx.type === 'DEPOSIT_STK' ? 'M-Pesa' :
                                                        tx.type === 'SALE_CASH' ? 'Cash Sale' :
                                                            tx.type === 'WITHDRAWAL' ? 'Withdrawal' :
                                                                tx.type.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 font-mono text-xs text-zinc-400 hidden sm:table-cell">{tx.reference || tx.id.slice(0, 12)}</td>
                                            <td className={`px-5 py-3.5 text-right text-sm font-semibold ${tx.type === 'WITHDRAWAL' ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                {tx.type === 'WITHDRAWAL' ? '-' : '+'} KES {Number(tx.amount).toLocaleString()}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className={`inline-flex items-center text-[10px] font-bold px-2 py-1 rounded-full ${tx.status === 'COMPLETED' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' :
                                                    tx.status === 'PENDING' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' :
                                                        'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                                    }`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-10 text-center text-sm text-zinc-400">
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
