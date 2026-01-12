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
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">System Overview & Monitoring</p>
                    </div>
                    <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                        <Button
                            onClick={fetchDashboardData}
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span className="hidden xs:inline text-xs sm:text-sm">Refresh</span>
                        </Button>
                        <Button
                            onClick={() => router.push('/admin/users')}
                            size="sm"
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2"
                        >
                            <Users className="w-4 h-4" />
                            <span className="hidden xs:inline text-xs sm:text-sm">Manage Users</span>
                        </Button>
                    </div>
                </div>

                {/* System Health Status Card */}
                {systemHealth && (
                    <Card className={`p-4 sm:p-6 border-2 ${systemHealth.summary.overallStatus === 'healthy' ? 'border-green-500 bg-green-50 dark:bg-green-900/10' :
                        systemHealth.summary.overallStatus === 'degraded' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' :
                            'border-red-500 bg-red-50 dark:bg-red-900/10'
                        }`}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    {systemHealth.summary.readyForProduction ? (
                                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                                    ) : (
                                        <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                                    )}
                                    <h3 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
                                        System Health: {systemHealth.summary.readyForProduction ? 'Ready' : 'Not Ready'}
                                    </h3>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-semibold text-green-600">{systemHealth.summary.passed} passed</span>
                                    {systemHealth.summary.warnings > 0 && (
                                        <span className="ml-2 font-semibold text-yellow-600">{systemHealth.summary.warnings} w</span>
                                    )}
                                    {systemHealth.summary.failed > 0 && (
                                        <span className="ml-2 font-semibold text-red-600">{systemHealth.summary.failed} f</span>
                                    )}
                                </p>
                            </div>
                            <Button
                                onClick={() => router.push('/admin/system-health')}
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto flex items-center justify-center gap-2"
                            >
                                Details
                                <ArrowUpRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </Card>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {/* Active Merchants */}
                    <Card className="p-4 sm:p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="p-2 sm:p-3 bg-white/20 rounded-lg">
                                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <span className="text-[10px] sm:text-xs font-medium bg-white/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                                Live
                            </span>
                        </div>
                        <div className="space-y-0.5 sm:space-y-1">
                            <p className="text-xs sm:text-sm opacity-90">Active Merchants</p>
                            <p className="text-2xl sm:text-3xl font-bold">{stats?.activeMerchants || 0}</p>
                            <p className="text-[10px] sm:text-xs opacity-75">
                                {stats?.pendingMerchants || 0} pending
                            </p>
                        </div>
                    </Card>

                    {/* Total Volume */}
                    <Card className="p-4 sm:p-6 bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="p-2 sm:p-3 bg-white/20 rounded-lg">
                                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <span className="text-[10px] sm:text-xs font-medium bg-white/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                                Lifetime
                            </span>
                        </div>
                        <div className="space-y-0.5 sm:space-y-1">
                            <p className="text-xs sm:text-sm opacity-90">Total Volume</p>
                            <p className="text-2xl sm:text-3xl font-bold truncate">
                                {formatCurrency(stats?.totalVolume || 0)}
                            </p>
                            <div className="flex items-center gap-1 text-[10px] sm:text-xs opacity-75">
                                <ArrowUpRight className="w-3 h-3" />
                                <span>{stats?.volumeGrowth || 0}% growth</span>
                            </div>
                        </div>
                    </Card>

                    {/* Pending Payouts */}
                    <Card className="p-4 sm:p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="p-2 sm:p-3 bg-white/20 rounded-lg">
                                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <span className="text-[10px] sm:text-xs font-medium bg-white/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                                Action Needed
                            </span>
                        </div>
                        <div className="space-y-0.5 sm:space-y-1">
                            <p className="text-xs sm:text-sm opacity-90">Pending Payouts</p>
                            <p className="text-2xl sm:text-3xl font-bold">{stats?.pendingPayouts || 0}</p>
                            <p className="text-[10px] sm:text-xs opacity-75 truncate">
                                {formatCurrency(stats?.pendingPayoutAmount || 0)} total
                            </p>
                        </div>
                    </Card>

                    {/* System Status */}
                    <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="p-2 sm:p-3 bg-white/20 rounded-lg">
                                <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <span className="text-[10px] sm:text-xs font-medium bg-green-400 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                                {stats?.systemStatus || 'ONLINE'}
                            </span>
                        </div>
                        <div className="space-y-0.5 sm:space-y-1">
                            <p className="text-xs sm:text-sm opacity-90">System Status</p>
                            <p className="text-2xl sm:text-3xl font-bold">{stats?.uptime || '99.9'}%</p>
                            <div className="flex items-center gap-2 text-[10px] sm:text-xs opacity-75">
                                <button className="hover:underline">Reboot</button>
                                <span>•</span>
                                <button className="hover:underline">Update</button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Analytics */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Revenue Analytics
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Last 7 days performance
                                </p>
                            </div>
                            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                                Simulated Data
                            </span>
                        </div>
                        <div className="h-64 flex items-end justify-between gap-2">
                            {[65, 45, 78, 52, 90, 67, 85].map((height, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <div
                                        className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg transition-all hover:from-indigo-600 hover:to-indigo-500 cursor-pointer"
                                        style={{ height: `${height}%` }}
                                    ></div>
                                    <span className="text-xs text-gray-500">
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Live Traffic */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Live Traffic
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Active users by hour
                                </p>
                            </div>
                            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                                Simulated Data
                            </span>
                        </div>
                        <div className="h-64 flex items-end justify-between gap-2">
                            {[120, 450, 890, 1100, 650, 320].map((value, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <div
                                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-500 cursor-pointer"
                                        style={{ height: `${(value / 1200) * 100}%` }}
                                    ></div>
                                    <span className="text-xs text-gray-500">
                                        {['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'][i]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Recent Transactions */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Recent Transactions Log
                        </h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/transactions')}
                        >
                            View All
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">TIME</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">USER</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">ACTION</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">AMOUNT</th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTransactions.length > 0 ? (
                                    recentTransactions.map((transaction: any) => (
                                        <tr key={transaction.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                                {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                                                {transaction.initiator?.name || transaction.initiator?.email || 'System'}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                                {transaction.type.replace(/_/g, ' ')}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900 dark:text-white">
                                                {formatCurrency(Number(transaction.amount))}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                                                    {transaction.status === 'COMPLETED' && <CheckCircle className="w-3 h-3" />}
                                                    {transaction.status === 'PENDING' && <Clock className="w-3 h-3" />}
                                                    {transaction.status === 'FAILED' && <XCircle className="w-3 h-3" />}
                                                    {transaction.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                                            No recent transactions
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Recent Users */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Recent User Registrations
                        </h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/admin/users')}
                        >
                            Manage Users
                        </Button>
                    </div>
                    <div className="space-y-4">
                        {recentUsers.length > 0 ? (
                            recentUsers.map((user: any) => (
                                <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                            {user.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{user.role}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                                            {user.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                                No recent users
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </DashboardLayout >
    );
}
