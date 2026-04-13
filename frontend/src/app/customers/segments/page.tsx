'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import crmService from '@/services/crm.service';
import {
    ArrowLeft,
    Users,
    Plus,
    Filter,
    MoreHorizontal,
    Trash2,
    RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function SegmentsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [segments, setSegments] = useState<any[]>([]);

    useEffect(() => {
        fetchSegments();
    }, []);

    const fetchSegments = async () => {
        try {
            const data = await crmService.getSegments();
            setSegments(data);
        } catch (error: any) {
            console.error('Failed to fetch segments:', error);
            // Handle PRO feature restriction nicely (optional: check generic error)
        } finally {
            setLoading(false);
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
                                Segments
                            </h1>
                            <p className="hidden md:block text-gray-500 dark:text-gray-400">
                                Group customers based on smart criteria
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => router.push('/customers/segments/new')}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden md:inline">Create Segment</span>
                    </Button>
                </div>

                {/* Segments Grid */}
                {segments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {segments.map((segment) => (
                            <Card key={segment.id} className="p-6 hover:shadow-lg transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                        <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                    </Button>
                                </div>

                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {segment.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                                    {segment.description || 'No description provided'}
                                </p>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Customers</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {segment._count?.customers || 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Last Updated</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatDistanceToNow(new Date(segment.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="w-full text-sm"
                                        onClick={() => router.push(`/customers/segments/${segment.id}`)}
                                    >
                                        View Customers
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <filter className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No Segments Created
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                            Create segments to group your customers based on their behavior, location, or purchase history.
                        </p>
                        <Button
                            onClick={() => router.push('/customers/segments/new')}
                            className="flex items-center gap-2 mx-auto"
                        >
                            <Plus className="w-4 h-4" />
                            Create First Segment
                        </Button>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
