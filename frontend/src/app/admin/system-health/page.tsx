'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    RefreshCw,
    Database,
    Mail,
    CreditCard,
    Shield,
    Settings,
    Users,
    Server
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

interface HealthCheck {
    name: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
    details?: any;
}

interface HealthSummary {
    overallStatus: 'healthy' | 'degraded' | 'critical';
    totalChecks: number;
    passed: number;
    warnings: number;
    failed: number;
    timestamp: string;
    readyForProduction: boolean;
}

interface HealthData {
    summary: HealthSummary;
    checks: HealthCheck[];
}

export default function SystemHealthPage() {
    const router = useRouter();
    const [health, setHealth] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [testingEmail, setTestingEmail] = useState(false);
    const [testingMpesa, setTestingMpesa] = useState(false);
    const [testEmail, setTestEmail] = useState('');

    useEffect(() => {
        fetchHealth();
        // Auto-refresh removed - data only updates on manual refresh
    }, []);

    const fetchHealth = async () => {
        try {
            setRefreshing(true);
            const { data } = await api.get('/system-health/health');
            setHealth(data);
        } catch (error: any) {
            console.error('Health check failed:', error);
            toast.error('Failed to fetch system health');
            if (error.response?.status === 403) {
                router.push('/dashboard');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleTestEmail = async () => {
        if (!testEmail) {
            toast.error('Please enter an email address');
            return;
        }

        try {
            setTestingEmail(true);
            await api.post('/system-health/test-email', { email: testEmail });
            toast.success(`Test email sent to ${testEmail}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Email test failed');
        } finally {
            setTestingEmail(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pass':
                return <CheckCircle className="w-6 h-6 text-green-500" />;
            case 'warning':
                return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
            case 'fail':
                return <XCircle className="w-6 h-6 text-red-500" />;
            default:
                return null;
        }
    };

    const getCheckIcon = (name: string) => {
        const iconMap: Record<string, any> = {
            'Database Connection': Database,
            'Environment Variables': Settings,
            'M-Pesa Configuration': CreditCard,
            'SMTP Configuration': Mail,
            'File Upload Permissions': Server,
            'System Settings': Settings,
            'Admin Users': Users,
            'Port Configuration': Server
        };
        const Icon = iconMap[name] || Shield;
        return <Icon className="w-5 h-5 text-gray-400" />;
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

    if (!health) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <p className="text-gray-500">Failed to load system health data</p>
                    <Button onClick={fetchHealth} className="mt-4">
                        Retry
                    </Button>
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
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            System Health Check
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Production readiness verification
                        </p>
                    </div>
                    <Button
                        onClick={fetchHealth}
                        disabled={refreshing}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Overall Status Card */}
                <Card className={`p-6 border-2 ${health.summary.overallStatus === 'healthy' ? 'border-green-500 bg-green-50 dark:bg-green-900/10' :
                    health.summary.overallStatus === 'degraded' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' :
                        'border-red-500 bg-red-50 dark:bg-red-900/10'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                {health.summary.readyForProduction ? (
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                ) : (
                                    <XCircle className="w-8 h-8 text-red-500" />
                                )}
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {health.summary.readyForProduction
                                        ? '✅ Ready for Production'
                                        : '⚠️ Not Ready for Production'}
                                </h2>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300">
                                <span className="font-semibold text-green-600">{health.summary.passed} passed</span>
                                {health.summary.warnings > 0 && (
                                    <span className="ml-3 font-semibold text-yellow-600">{health.summary.warnings} warnings</span>
                                )}
                                {health.summary.failed > 0 && (
                                    <span className="ml-3 font-semibold text-red-600">{health.summary.failed} failed</span>
                                )}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Last checked: {new Date(health.summary.timestamp).toLocaleString()}
                            </p>
                        </div>
                        <div className={`text-6xl font-bold ${health.summary.overallStatus === 'healthy' ? 'text-green-500' :
                            health.summary.overallStatus === 'degraded' ? 'text-yellow-500' :
                                'text-red-500'
                            }`}>
                            {health.summary.overallStatus === 'healthy' ? '✓' : '✗'}
                        </div>
                    </div>
                </Card>

                {/* Health Checks Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {health.checks.map((check) => (
                        <Card
                            key={check.name}
                            className={`p-4 ${check.status === 'pass' ? 'border-l-4 border-green-500' :
                                check.status === 'warning' ? 'border-l-4 border-yellow-500' :
                                    'border-l-4 border-red-500'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-1">
                                    {getStatusIcon(check.status)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        {getCheckIcon(check.name)}
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {check.name}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {check.message}
                                    </p>
                                    {check.details && (
                                        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                                            <pre className="text-gray-700 dark:text-gray-300 overflow-x-auto">
                                                {JSON.stringify(check.details, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Test Tools */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Email Test */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Mail className="w-5 h-5" />
                            Test Email Configuration
                        </h3>
                        <div className="space-y-3">
                            <input
                                type="email"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                placeholder="Enter email address"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                            <Button
                                onClick={handleTestEmail}
                                disabled={testingEmail || !testEmail}
                                className="w-full"
                            >
                                {testingEmail ? 'Sending...' : 'Send Test Email'}
                            </Button>
                        </div>
                    </Card>

                    {/* M-Pesa Test */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            M-Pesa Configuration Status
                        </h3>
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                M-Pesa credentials are {health.checks.find(c => c.name === 'M-Pesa Configuration')?.status === 'pass' ? 'configured' : 'not configured'}.
                            </p>
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <p className="text-xs text-blue-800 dark:text-blue-300">
                                    ℹ️ Test M-Pesa STK Push from the POS or Sales page
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Recommendations */}
                {!health.summary.readyForProduction && (
                    <Card className="p-6 bg-yellow-50 dark:bg-yellow-900/10 border-yellow-500">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            Action Required
                        </h3>
                        <ul className="space-y-2">
                            {health.checks.filter(c => c.status !== 'pass').map((check) => (
                                <li key={check.name} className="text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-semibold">{check.name}:</span> {check.message}
                                    {check.details?.note && (
                                        <span className="ml-2 text-gray-600 dark:text-gray-400">
                                            ({check.details.note})
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
