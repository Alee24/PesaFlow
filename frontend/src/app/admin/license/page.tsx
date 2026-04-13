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
    RefreshCw,
    Clock,
    Mail,
    Phone,
    Building2,
    FileText
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function LicenseManagementPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState(false);
    const [licenseStatus, setLicenseStatus] = useState<any>(null);
    const [serverInfo, setServerInfo] = useState<any>(null);
    const [requests, setRequests] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [selectedTab, setSelectedTab] = useState<'status' | 'requests' | 'activate' | 'generate'>('status');


    const [domain, setDomain] = useState('');
    const [maxUsers, setMaxUsers] = useState(100);
    const [durationDays, setDurationDays] = useState(365);
    const [features, setFeatures] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([
            fetchLicenseStatus(),
            fetchServerInfo(),
            fetchLicenseRequests()
        ]);
        setLoading(false);
    };

    const fetchLicenseStatus = async () => {
        try {
            const { data } = await api.get('/license/status');
            setLicenseStatus(data);
        } catch (error: any) {
            console.error('Failed to fetch license status:', error);
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

    const fetchLicenseRequests = async () => {
        try {
            const { data } = await api.get('/license/requests');
            setRequests(data.requests || []);
            setStats(data.stats || {});
        } catch (error) {
            console.error('Failed to fetch license requests:', error);
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
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to activate license');
        } finally {
            setActivating(false);
        }
    };

    const handleApproveRequest = async (requestId: string, request: any) => {
        try {
            await api.post(`/license/requests/${requestId}/approve`, {
                maxUsers: request.requestedUsers,
                durationDays: request.requestedDays,
                features: ['all']
            });

            toast.success('License request approved and activated!');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to approve request');
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        try {
            await api.post(`/license/requests/${requestId}/reject`, { reason });
            toast.success('License request rejected');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to reject request');
        }
    };

    const handleDeleteRequest = async (requestId: string) => {
        if (!confirm('Are you sure you want to delete this request?')) return;

        try {
            await api.delete(`/license/requests/${requestId}`);
            toast.success('License request deleted');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete request');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            APPROVED: 'bg-green-100 text-green-800',
            REJECTED: 'bg-red-100 text-red-800'
        };
        return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
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
                            View and manage system license status
                        </p>
                    </div>
                    <Button
                        onClick={fetchData}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </Button>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Requests</p>
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-yellow-100 rounded-full">
                                    <Clock className="w-6 h-6 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Pending</p>
                                    <p className="text-2xl font-bold">{stats.pending}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-100 rounded-full">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Approved</p>
                                    <p className="text-2xl font-bold">{stats.approved}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-red-100 rounded-full">
                                    <XCircle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Rejected</p>
                                    <p className="text-2xl font-bold">{stats.rejected}</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                    <button
                        onClick={() => setSelectedTab('status')}
                        className={`px-4 py-2 font-medium whitespace-nowrap ${selectedTab === 'status'
                            ? 'border-b-2 border-indigo-600 text-indigo-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        My License
                    </button>
                    <button
                        onClick={() => setSelectedTab('requests')}
                        className={`px-4 py-2 font-medium whitespace-nowrap ${selectedTab === 'requests'
                            ? 'border-b-2 border-indigo-600 text-indigo-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        License Requests ({stats?.pending || 0})
                    </button>
                    <button
                        onClick={() => setSelectedTab('activate')}
                        className={`px-4 py-2 font-medium whitespace-nowrap ${selectedTab === 'activate'
                            ? 'border-b-2 border-indigo-600 text-indigo-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Manual Activation
                    </button>
                    <button
                        onClick={() => setSelectedTab('generate')}
                        className={`px-4 py-2 font-medium whitespace-nowrap ${selectedTab === 'generate'
                            ? 'border-b-2 border-indigo-600 text-indigo-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Generate Keys
                    </button>
                </div>

                {/* License Requests Tab */}
                {selectedTab === 'requests' && (
                    <div className="space-y-4">
                        {requests.length === 0 ? (
                            <Card className="p-12 text-center">
                                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No license requests yet</p>
                            </Card>
                        ) : (
                            requests.map((request) => (
                                <Card key={request.id} className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <Building2 className="w-5 h-5 text-gray-400" />
                                                <h3 className="text-lg font-bold">{request.companyName}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                                                    {request.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                Requested {formatDistanceToNow(new Date(request.createdAt))} ago
                                            </p>
                                        </div>
                                        {request.status === 'PENDING' && (
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleApproveRequest(request.id, request)}
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    onClick={() => handleRejectRequest(request.id)}
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                                >
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-500">Email</p>
                                                <p className="text-sm font-medium">{request.contactEmail}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-500">Phone</p>
                                                <p className="text-sm font-medium">{request.contactPhone}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Server className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-500">Domain</p>
                                                <p className="text-sm font-medium">{request.domain}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-500">Users / Days</p>
                                                <p className="text-sm font-medium">{request.requestedUsers} / {request.requestedDays}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                        <p className="text-xs text-gray-500 mb-1">Server Fingerprint</p>
                                        <p className="text-xs font-mono break-all">{request.fingerprint}</p>
                                    </div>

                                    {request.purpose && (
                                        <div className="mt-3">
                                            <p className="text-xs text-gray-500 mb-1">Purpose</p>
                                            <p className="text-sm">{request.purpose}</p>
                                        </div>
                                    )}

                                    {request.status !== 'PENDING' && (
                                        <div className="mt-3 flex justify-end">
                                            <Button
                                                onClick={() => handleDeleteRequest(request.id)}
                                                size="sm"
                                                variant="outline"
                                                className="text-gray-600"
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    )}
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {/* Current License Status Tab */}
                {selectedTab === 'status' && licenseStatus && (
                    <Card className={`p-6 border-2 ${licenseStatus.valid
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                        : 'border-red-500 bg-red-50 dark:bg-red-900/10'
                        }`}>
                        <div className="flex items-center gap-4 mb-4">
                            {licenseStatus.valid ? (
                                <CheckCircle className="w-12 h-12 text-green-500" />
                            ) : (
                                <XCircle className="w-12 h-12 text-red-500" />
                            )}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {licenseStatus.valid ? 'License Active' : 'No Valid License'}
                                </h2>
                                <p className="text-sm text-gray-600">
                                    {licenseStatus.valid
                                        ? 'Application is fully licensed and operational'
                                        : licenseStatus.message || 'License activation required'}
                                </p>
                            </div>
                        </div>

                        {licenseStatus.valid && licenseStatus.license && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="flex items-center gap-3">
                                    <Server className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Domain</p>
                                        <p className="font-semibold">{licenseStatus.license.domain}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Expires</p>
                                        <p className="font-semibold">
                                            {licenseStatus.license.expiresAt
                                                ? new Date(licenseStatus.license.expiresAt).toLocaleDateString()
                                                : 'Lifetime Access'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Users className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Max Users</p>
                                        <p className="font-semibold">Unlimited</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Status</p>
                                        <p className="font-semibold text-green-600">{licenseStatus.license.status}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>
                )}

                {/* Manual Activation Tab */}
                {selectedTab === 'activate' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Key className="w-5 h-5" />
                                Activate License
                            </h3>

                            <form onSubmit={handleActivateLicense} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Domain <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={domain}
                                        onChange={(e) => setDomain(e.target.value)}
                                        placeholder="example.com"
                                        className="w-full px-4 py-2 border rounded-lg"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Max Users</label>
                                        <input
                                            type="number"
                                            value={maxUsers}
                                            onChange={(e) => setMaxUsers(parseInt(e.target.value))}
                                            min="1"
                                            className="w-full px-4 py-2 border rounded-lg"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Duration (Days)</label>
                                        <input
                                            type="number"
                                            value={durationDays}
                                            onChange={(e) => setDurationDays(parseInt(e.target.value))}
                                            min="1"
                                            className="w-full px-4 py-2 border rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Features</label>
                                    <input
                                        type="text"
                                        value={features}
                                        onChange={(e) => setFeatures(e.target.value)}
                                        placeholder="all"
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                </div>

                                <Button type="submit" disabled={activating} className="w-full">
                                    {activating ? 'Activating...' : 'Activate License'}
                                </Button>
                            </form>
                        </Card>

                        {serverInfo && (
                            <Card className="p-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Server className="w-5 h-5" />
                                    Server Information
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm text-gray-500">Server Fingerprint</label>
                                        <div className="mt-1 p-3 bg-gray-100 rounded font-mono text-sm break-all">
                                            {serverInfo.fingerprint}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm text-gray-500">Domain</label>
                                            <div className="mt-1 p-3 bg-gray-100 rounded font-mono text-sm">
                                                {serverInfo.domain}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-500">Hostname</label>
                                            <div className="mt-1 p-3 bg-gray-100 rounded font-mono text-sm">
                                                {serverInfo.hostname}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                )}
                {/* Generate Keys Tab */}
                {selectedTab === 'generate' && (
                    <Card className="p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Key className="w-5 h-5" />
                            Generate User License Keys
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Number of Keys</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        defaultValue="1"
                                        id="keyCount"
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Validity (Days)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        defaultValue="365"
                                        id="validityDays"
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                </div>
                                <Button
                                    onClick={async () => {
                                        const count = (document.getElementById('keyCount') as HTMLInputElement).value;
                                        const expiresInDays = (document.getElementById('validityDays') as HTMLInputElement).value;

                                        try {
                                            const { data } = await api.post('/user-license/generate', {
                                                count: parseInt(count),
                                                expiresInDays: parseInt(expiresInDays)
                                            });

                                            toast.success(`Generated ${data.keys.length} keys!`);
                                            // Copy to clipboard
                                            const keysText = data.keys.map((k: any) => k.licenseKey).join('\n');
                                            navigator.clipboard.writeText(keysText);
                                            toast.success('Keys copied to clipboard');

                                            // Refresh list
                                            fetchData();
                                        } catch (e: any) {
                                            toast.error(e.response?.data?.error || 'Failed to generate keys');
                                        }
                                    }}
                                    className="w-full"
                                >
                                    Generate & Copy Keys
                                </Button>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold mb-2 text-sm text-gray-600">Generated Keys</h4>
                                <p className="text-xs text-gray-500 mb-4">Keys generated here can be used by users on the activation page.</p>
                                <div className="space-y-2 max-h-60 overflow-y-auto" id="generatedKeysList">
                                    {/* Keys will be shown here via toast/clipboard for now */}
                                    <div className="text-center text-gray-400 py-8 text-sm">
                                        No keys generated yet
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
