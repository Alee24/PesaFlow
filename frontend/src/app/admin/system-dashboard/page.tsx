'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import {
    TrendingUp,
    Users,
    DollarSign,
    Activity,
    CreditCard,
    Building2,
    PieChart,
    CheckCircle,
    XCircle,
    ArrowUpRight
} from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';

interface SystemDashboardData {
    overview: {
        totalRevenue: number;
        serviceCharges: number;
        netRevenue: number;
        totalMerchants: number;
        activeMerchants: number;
        totalTransactions: number;
        completedTransactions: number;
        successRate: number;
        avgTransactionValue: number;
    };
    topMerchants: Array<{
        merchantId: string;
        merchantName: string;
        revenue: number;
        transactions: number;
        serviceChargesPaid: number;
    }>;
    paymentMethods: Array<{
        method: string;
        count: number;
        amount: number;
        percentage: number;
    }>;
    trends: any[];
    subscriptions: Record<string, number>;
    branches: Array<{
        branchId: string;
        branchName: string;
        merchantName: string;
        teamMembers: number;
        location: string | null;
    }>;
    period: string;
}

export default function SystemDashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('month');
    const [data, setData] = useState<SystemDashboardData | null>(null);
    const [systemHealth, setSystemHealth] = useState<any>(null);

    useEffect(() => {
        fetchDashboardData();
        fetchSystemHealth();
    }, [period]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/admin-dashboard/system-dashboard?period=${period}`);
            setData(response.data);
        } catch (error: any) {
            console.error('Failed to fetch system dashboard:', error);
            if (error.response?.status === 403) {
                router.push('/dashboard');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchSystemHealth = async () => {
        try {
            const response = await api.get('/system-health/health');
            setSystemHealth(response.data);
        } catch (error: any) {
            console.error('Failed to fetch system health:', error);
        }
    };

    const formatCurrency = (amount: number) => {
        return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!data) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <p className="text-gray-500">Failed to load dashboard data</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Dashboard</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Comprehensive system analytics and performance metrics
                        </p>
                    </div>
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                        <option value="day">Last 24 Hours</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="year">Last Year</option>
                    </select>
                </div>

                {/* System Health Status */}
                {systemHealth && (
                    <Card className={`p-6 border-2 ${systemHealth.summary.overallStatus === 'healthy' ? 'border-green-500 bg-green-50 dark:bg-green-900/10' :
                        systemHealth.summary.overallStatus === 'degraded' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' :
                            'border-red-500 bg-red-50 dark:bg-red-900/10'
                        }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    {systemHealth.summary.readyForProduction ? (
                                        <CheckCircle className="w-6 h-6 text-green-500" />
                                    ) : (
                                        <XCircle className="w-6 h-6 text-red-500" />
                                    )}
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        System Health: {systemHealth.summary.readyForProduction ? 'Ready for Production' : 'Not Ready'}
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-semibold text-green-600">{systemHealth.summary.passed} passed</span>
                                    {systemHealth.summary.warnings > 0 && (
                                        <span className="ml-3 font-semibold text-yellow-600">{systemHealth.summary.warnings} warnings</span>
                                    )}
                                    {systemHealth.summary.failed > 0 && (
                                        <span className="ml-3 font-semibold text-red-600">{systemHealth.summary.failed} failed</span>
                                    )}
                                </p>
                            </div>
                            <Button
                                onClick={() => router.push('/admin/system-health')}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                View Full Report
                                <ArrowUpRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {formatCurrency(data.overview.totalRevenue)}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Service Charges</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {formatCurrency(data.overview.serviceCharges)}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Active Merchants</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {data.overview.activeMerchants}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    of {data.overview.totalMerchants} total
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Success Rate</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {data.overview.successRate.toFixed(1)}%
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {data.overview.completedTransactions} of {data.overview.totalTransactions}
                                </p>
                            </div>
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-full">
                                <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Top Merchants */}
                <Card className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        Top Merchants by Revenue
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Merchant
                                    </th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Revenue
                                    </th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Transactions
                                    </th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Service Charges
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.topMerchants.map((merchant, index) => (
                                    <tr
                                        key={merchant.merchantId}
                                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                    >
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold">
                                                    {index + 1}
                                                </div>
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {merchant.merchantName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                                            {formatCurrency(merchant.revenue)}
                                        </td>
                                        <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                                            {merchant.transactions.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                                            {formatCurrency(merchant.serviceChargesPaid)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Payment Methods & Subscriptions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Payment Methods */}
                    <Card className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Payment Methods
                        </h2>
                        <div className="space-y-3">
                            {data.paymentMethods.map((method) => (
                                <div key={method.method} className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {method.method}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {method.percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-indigo-600 h-2 rounded-full"
                                                style={{ width: `${method.percentage}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-xs text-gray-500">
                                                {method.count} transactions
                                            </span>
                                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                {formatCurrency(method.amount)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Subscriptions */}
                    <Card className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <PieChart className="w-5 h-5" />
                            Subscription Distribution
                        </h2>
                        <div className="space-y-3">
                            {Object.entries(data.subscriptions).map(([plan, count]) => (
                                <div key={plan} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                    <span className="font-medium text-gray-900 dark:text-white">{plan}</span>
                                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                        {count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Branches */}
                {data.branches.length > 0 && (
                    <Card className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            Branch Overview
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Branch
                                        </th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Merchant
                                        </th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Team Members
                                        </th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Location
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.branches.map((branch) => (
                                        <tr
                                            key={branch.branchId}
                                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                        >
                                            <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                                                {branch.branchName}
                                            </td>
                                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                                                {branch.merchantName}
                                            </td>
                                            <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                                                {branch.teamMembers}
                                            </td>
                                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                                                {branch.location || 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
