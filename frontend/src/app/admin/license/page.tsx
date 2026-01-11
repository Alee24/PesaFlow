'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    Shield,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Key,
    Server,
    Calendar,
    Users,
    RefreshCw
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function LicenseManagementPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState(false);
    const [licenseStatus, setLicenseStatus] = useState<any>(null);
    const [serverInfo, setServerInfo] = useState<any>(null);

    // Activation form
    const [domain, setDomain] = useState('');
    const [maxUsers, setMaxUsers] = useState(100);
    const [durationDays, setDurationDays] = useState(365);
    const [features, setFeatures] = useState('all');

    useEffect(() => {
        fetchLicenseStatus();
        fetchServerInfo();
    }, []);

    const fetchLicenseStatus = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/license/status');
            setLicenseStatus(data);
        } catch (error: any) {
            console.error('Failed to fetch license status:', error);
            if (error.response?.status !== 403) {
                toast.error('Failed to fetch license status');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchServerInfo = async () => {
        try {
            const { data } = await api.get('/license/fingerprint');
            setServerInfo(data);
            setDomain(data.domain || '');
        } catch (error) {
            console.error('Failed to fetch server info:', error);
        }
    };

    const handleActivateLicense = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!domain) {
            toast.error('Please enter a domain');
            return;
        }

        try {
            setActivating(true);
            await api.post('/license/activate', {
                domain,
                maxUsers,
                durationDays,
                features: features.split(',').map(f => f.trim())
            });

            toast.success('License activated successfully!');
            fetchLicenseStatus();
            fetchServerInfo();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to activate license');
        } finally {
            setActivating(false);
        }
    };

    const getStatusColor = (valid: boolean) => {
        return valid ? 'text-green-600' : 'text-red-600';
    };

    const getStatusBg = (valid: boolean) => {
        return valid ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500';
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

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            License Management
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Manage application licensing and activation
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            fetchLicenseStatus();
                            fetchServerInfo();
                        }}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </Button>
                </div>

                {/* License Status Card */}
                <Card className={`p-6 border-2 ${licenseStatus?.valid ? getStatusBg(true) : getStatusBg(false)}`}>
                    <div className="flex items-center gap-4 mb-4">
                        {licenseStatus?.valid ? (
                            <CheckCircle className="w-12 h-12 text-green-500" />
                        ) : (
                            <XCircle className="w-12 h-12 text-red-500" />
                        )}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {licenseStatus?.valid ? 'License Active' : 'No Valid License'}
                            </h2>
                            <p className={`text-sm ${getStatusColor(licenseStatus?.valid)}`}>
                                {licenseStatus?.valid
                                    ? 'Application is fully licensed and operational'
                                    : licenseStatus?.message || 'License activation required'}
                            </p>
                        </div>
                    </div>

                    {licenseStatus?.valid && licenseStatus?.license && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                            <div className="flex items-center gap-3">
                                <Server className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Domain</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {licenseStatus.license.domain}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Expires</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {new Date(licenseStatus.license.expiresAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Max Users</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {licenseStatus.license.maxUsers}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Status</p>
                                    <p className="font-semibold text-green-600">
                                        {licenseStatus.license.status}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Server Information */}
                {serverInfo && (
                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Server className="w-5 h-5" />
                            Server Information
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm text-gray-500">Server Fingerprint</label>
                                <div className="mt-1 p-3 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm break-all">
                                    {serverInfo.fingerprint}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-500">Domain</label>
                                    <div className="mt-1 p-3 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                                        {serverInfo.domain}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Hostname</label>
                                    <div className="mt-1 p-3 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                                        {serverInfo.hostname}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* License Activation Form */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Key className="w-5 h-5" />
                        Activate License
                    </h3>

                    <form onSubmit={handleActivateLicense} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Domain <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                placeholder="example.com"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                The domain where this application is hosted
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Max Users
                                </label>
                                <input
                                    type="number"
                                    value={maxUsers}
                                    onChange={(e) => setMaxUsers(parseInt(e.target.value))}
                                    min="1"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Duration (Days)
                                </label>
                                <input
                                    type="number"
                                    value={durationDays}
                                    onChange={(e) => setDurationDays(parseInt(e.target.value))}
                                    min="1"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    365 days = 1 year
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Features (comma-separated)
                            </label>
                            <input
                                type="text"
                                value={features}
                                onChange={(e) => setFeatures(e.target.value)}
                                placeholder="all"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Use "all" for full access, or specify: "pos,products,sales"
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                type="submit"
                                disabled={activating}
                                className="flex items-center gap-2"
                            >
                                {activating ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Activating...
                                    </>
                                ) : (
                                    <>
                                        <Key className="w-4 h-4" />
                                        Activate License
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Warning */}
                <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-yellow-900 dark:text-yellow-300">
                                Important Notes
                            </h4>
                            <ul className="text-sm text-yellow-800 dark:text-yellow-400 mt-2 space-y-1 list-disc list-inside">
                                <li>License is bound to server hardware - cannot be transferred</li>
                                <li>Changing server hardware will invalidate the license</li>
                                <li>Domain must match exactly (including subdomain)</li>
                                <li>License activation is immediate and cannot be undone</li>
                                <li>Keep the server fingerprint for your records</li>
                            </ul>
                        </div>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
