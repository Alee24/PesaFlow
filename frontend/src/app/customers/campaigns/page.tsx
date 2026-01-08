'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import crmService from '@/services/crm.service';
import {
    ArrowLeft,
    Mail,
    Plus,
    Search,
    Calendar,
    Send,
    BarChart2,
    Clock,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function CampaignsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [campaigns, setCampaigns] = useState<any[]>([]);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const data = await crmService.getCampaigns();
            setCampaigns(data);
        } catch (error: any) {
            console.error('Failed to fetch campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SENT': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
            case 'SCHEDULED': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300';
            case 'DRAFT': return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300';
            case 'FAILED': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
            default: return 'text-gray-600 bg-gray-100';
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
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/customers')}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden md:inline">Customers</span>
                        </Button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                Email Campaigns
                            </h1>
                            <p className="hidden md:block text-gray-500 dark:text-gray-400">
                                Create and manage email marketing campaigns
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => router.push('/customers/campaigns/new')}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden md:inline">New Campaign</span>
                    </Button>
                </div>

                {/* Campaigns List */}
                {campaigns.length > 0 ? (
                    <div className="space-y-4">
                        {campaigns.map((campaign) => (
                            <Card key={campaign.id} className="p-6 hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {campaign.name}
                                            </h3>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                                                {campaign.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                            <div className="flex items-center gap-1">
                                                <Mail className="w-4 h-4" />
                                                <span>Subject: {campaign.subject}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                <span>
                                                    {campaign.sentAt
                                                        ? `Sent ${formatDistanceToNow(new Date(campaign.sentAt), { addSuffix: true })}`
                                                        : `Created ${formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}`
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Recipients</p>
                                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {campaign.totalRecipients || 0}
                                                </p>
                                            </div>
                                            <div className="bg-green-50 dark:bg-green-900/50 p-3 rounded-lg">
                                                <p className="text-xs text-green-600 dark:text-green-400 mb-1">Sent</p>
                                                <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                                                    {campaign.sentCount || 0}
                                                </p>
                                            </div>
                                            <div className="bg-blue-50 dark:bg-blue-900/50 p-3 rounded-lg">
                                                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Opened</p>
                                                <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                                                    {campaign.openedCount || 0}
                                                </p>
                                            </div>
                                            <div className="bg-purple-50 dark:bg-purple-900/50 p-3 rounded-lg">
                                                <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Clicked</p>
                                                <p className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                                                    {campaign.clickedCount || 0}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-center gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => router.push(`/customers/campaigns/${campaign.id}`)}
                                        >
                                            View Details
                                        </Button>
                                        {campaign.status === 'DRAFT' && (
                                            <Button
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                onClick={async () => {
                                                    if (confirm('Send this campaign now?')) {
                                                        try {
                                                            await crmService.sendCampaign(campaign.id);
                                                            fetchCampaigns();
                                                        } catch (e) {
                                                            alert('Failed to send campaign');
                                                        }
                                                    }
                                                }}
                                            >
                                                Send Now
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="p-12 text-center">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No Campaigns Yet
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                            Create your first email campaign to engage with your customers and boost sales.
                        </p>
                        <Button
                            onClick={() => router.push('/customers/campaigns/new')}
                            className="flex items-center gap-2 mx-auto bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Plus className="w-4 h-4" />
                            Create First Campaign
                        </Button>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
