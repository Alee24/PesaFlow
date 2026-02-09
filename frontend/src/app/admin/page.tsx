'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    Users,
    DollarSign,
    AlertCircle,
    TrendingUp,
    Activity,
    RefreshCw,
    CheckCircle,
    XCircle,
    Clock,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [systemLogs, setSystemLogs] = useState<any[]>([]);
    const [systemHealth, setSystemHealth] = useState<any>(null);

    useEffect(() => {
        fetchDashboardData();
        fetchSystemHealth();
        // Auto-refresh removed - data only updates on manual page refresh
    }, []);

    useEffect(() => {
        fetchSystemLogs();
        // Auto-refresh removed - logs only update on manual page refresh
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, transactionsRes, usersRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/transactions?limit=10'),
                api.get('/admin/users?limit=5')
            ]);

            setStats(statsRes.data);
            setRecentTransactions(transactionsRes.data.transactions || []);
            setRecentUsers(usersRes.data.slice(0, 5) || []);
        } catch (error: any) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSystemLogs = async () => {
        try {
            const response = await api.get('/admin/system/logs');
            setSystemLogs(response.data.logs || []);
        } catch (error: any) {
            console.error('Failed to fetch system logs:', error);
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
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES'
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
            case 'COMPLETED':
                return 'text-green-600 bg-green-100';
            case 'PENDING':
            case 'PENDING_VERIFICATION':
                return 'text-yellow-600 bg-yellow-100';
            case 'REJECTED':
            case 'FAILED':
                return 'text-red-600 bg-red-100';
            case 'SUSPENDED':
                return 'text-orange-600 bg-orange-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-2">
                {/* Header */}
                <div className="flex justify-between items-center gap-2">
                    <div>
                        <h1 className="text-base font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-[10px]">System Overview & Monitoring</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            onClick={fetchDashboardData}
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-8 text-xs"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span className="hidden xs:inline">Refresh</span>
                        </Button>
                        <Button
                            onClick={() => router.push('/admin/users')}
                            size="sm"
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-8 text-xs"
                        >
                            <Users className="w-3.5 h-3.5" />
                            <span className="hidden xs:inline">Manage Users</span>
                        </Button>
                    </div>
                </div>

                {/* System Health Status Card */}
                {systemHealth && (
                    <Card className={`p-2 border ${systemHealth.summary.overallStatus === 'healthy' ? 'border-green-500 bg-green-50 dark:bg-green-900/10' :
                        systemHealth.summary.overallStatus === 'degraded' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' :
                            'border-red-500 bg-red-50 dark:bg-red-900/10'
                        }`}>
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                                {systemHealth.summary.readyForProduction ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                                        System Health: {systemHealth.summary.readyForProduction ? 'Ready' : 'Not Ready'}
                                    </h3>
                                    <p className="text-[10px] text-gray-700 dark:text-gray-300">
                                        <span className="font-semibold text-green-600">{systemHealth.summary.passed} passed</span>
                                        {systemHealth.summary.warnings > 0 && (
                                            <span className="ml-1 font-semibold text-yellow-600">{systemHealth.summary.warnings} w</span>
                                        )}
                                        {systemHealth.summary.failed > 0 && (
                                            <span className="ml-1 font-semibold text-red-600">{systemHealth.summary.failed} f</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={() => router.push('/admin/system-health')}
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-2"
                            >
                                Details
                            </Button>
                        </div>
                    </Card>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-4 gap-2">
                    {/* Active Merchants */}
                    <Card className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                        <div className="flex items-center justify-between mb-1">
                            <div className="p-1 bg-white/20 rounded">
                                <Users className="w-3 h-3" />
                            </div>
                            <span className="text-[8px] font-medium bg-white/20 px-1.5 py-0.5 rounded-full">
                                Live
                            </span>
                        </div>
                        <div>
                            <p className="text-[10px] opacity-90">Active Merchants</p>
                            <p className="text-lg font-bold">{stats?.activeMerchants || 0}</p>
                            <p className="text-[8px] opacity-75">
                                {stats?.pendingMerchants || 0} pending
                            </p>
                        </div>
                    </Card>

                    {/* Total Volume */}
                    <Card className="p-2 bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                        <div className="flex items-center justify-between mb-1">
                            <div className="p-1 bg-white/20 rounded">
                                <DollarSign className="w-3 h-3" />
                            </div>
                            <span className="text-[8px] font-medium bg-white/20 px-1.5 py-0.5 rounded-full">
                                Lifetime
                            </span>
                        </div>
                        <div>
                            <p className="text-[10px] opacity-90">Total Volume</p>
                            <p className="text-base font-bold truncate">
                                {formatCurrency(stats?.totalVolume || 0)}
                            </p>
                            <div className="flex items-center gap-1 text-[8px] opacity-75">
                                <ArrowUpRight className="w-2 h-2" />
                                <span>{stats?.volumeGrowth || 0}%</span>
                            </div>
                        </div>
                    </Card>

                    {/* Pending Payouts */}
                    <Card className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
                        <div className="flex items-center justify-between mb-1">
                            <div className="p-1 bg-white/20 rounded">
                                <AlertCircle className="w-3 h-3" />
                            </div>
                            <span className="text-[8px] font-medium bg-white/20 px-1.5 py-0.5 rounded-full">
                                Action
                            </span>
                        </div>
                        <div>
                            <p className="text-[10px] opacity-90">Pending Payouts</p>
                            <p className="text-lg font-bold">{stats?.pendingPayouts || 0}</p>
                            <p className="text-[8px] opacity-75 truncate">
                                {formatCurrency(stats?.pendingPayoutAmount || 0)}
                            </p>
                        </div>
                    </Card>

                    {/* System Status */}
                    <Card className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                        <div className="flex items-center justify-between mb-1">
                            <div className="p-1 bg-white/20 rounded">
                                <Activity className="w-3 h-3" />
                            </div>
                            <span className="text-[8px] font-medium bg-green-400 px-1.5 py-0.5 rounded-full">
                                {stats?.systemStatus || 'ON'}
                            </span>
                        </div>
                        <div>
                            <p className="text-[10px] opacity-90">System Status</p>
                            <p className="text-lg font-bold">{stats?.uptime || '99.9'}%</p>
                            <p className="text-[8px] opacity-75">Uptime</p>
                        </div>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-2 gap-2">
                    {/* Revenue Analytics */}
                    <Card className="p-2">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-semibold text-gray-900 dark:text-white">
                                Revenue (7d)
                            </h3>
                            <span className="text-[8px] text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                                Sim
                            </span>
                        </div>
                        <div className="h-20 flex items-end justify-between gap-0.5">
                            {[65, 45, 78, 52, 90, 67, 85].map((height, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <div
                                        className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-sm transition-all hover:from-indigo-600 hover:to-indigo-500 cursor-pointer"
                                        style={{ height: `${height}%` }}
                                    ></div>
                                    <span className="text-[10px] text-gray-500">
                                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Live Traffic */}
                    <Card className="p-2">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-semibold text-gray-900 dark:text-white">
                                Live Traffic
                            </h3>
                            <span className="text-[8px] text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                                Sim
                            </span>
                        </div>
                        <div className="h-20 flex items-end justify-between gap-0.5">
                            {[120, 450, 890, 1100, 650, 320].map((value, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <div
                                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm transition-all hover:from-blue-600 hover:to-blue-500 cursor-pointer"
                                        style={{ height: `${(value / 1200) * 100}%` }}
                                    ></div>
                                    <span className="text-[10px] text-gray-500">
                                        {['00', '04', '08', '12', '16', '20'][i]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {/* Recent Transactions */}
                    <Card className="p-2">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Recent Transactions
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push('/transactions')}
                                className="h-7 text-xs"
                            >
                                View All
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">Time</th>
                                        <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">User</th>
                                        <th className="text-right py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">Amount</th>
                                        <th className="text-center py-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTransactions.length > 0 ? (
                                        recentTransactions.slice(0, 5).map((transaction: any) => (
                                            <tr key={transaction.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="py-2 px-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                                                </td>
                                                <td className="py-2 px-2 text-xs text-gray-900 dark:text-white font-medium truncate max-w-[100px]">
                                                    {transaction.initiator?.name || transaction.initiator?.email || 'System'}
                                                </td>
                                                <td className="py-2 px-2 text-xs text-right font-semibold text-gray-900 dark:text-white">
                                                    {formatCurrency(Number(transaction.amount))}
                                                </td>
                                                <td className="py-2 px-2 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(transaction.status)}`}>
                                                        {transaction.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                                                No recent transactions
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Recent Users */}
                    <Card className="p-2">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Recent Users
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push('/admin/users')}
                                className="h-7 text-xs"
                            >
                                Manage
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {recentUsers.length > 0 ? (
                                recentUsers.slice(0, 5).map((user: any) => (
                                    <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
                                                {user.name?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-gray-900 dark:text-white truncate max-w-[100px]">{user.name}</p>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(user.status)}`}>
                                                {user.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                                    No recent users
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout >
    );
}
