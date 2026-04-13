'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import crmService from '@/services/crm.service';
import { ArrowLeft, Send, Users } from 'lucide-react';

export default function NewCampaignPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [segments, setSegments] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        segmentId: '',
        content: '',
        scheduledAt: ''
    });

    useEffect(() => {
        fetchSegments();
    }, []);

    const fetchSegments = async () => {
        try {
            const data = await crmService.getSegments();
            setSegments(data);
        } catch (error) {
            console.error('Failed to fetch segments');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await crmService.createCampaign(formData);
            router.push('/customers/campaigns');
        } catch (error: any) {
            console.error('Failed to create campaign:', error);
            alert('Failed to create campaign. Please check PRO features.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            New Email Campaign
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Compose and schedule a new email blast
                        </p>
                    </div>
                </div>

                {/* Form */}
                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Campaign Details */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Campaign Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                                    placeholder="e.g., Summer Sale Announcement"
                                />
                                <p className="text-xs text-gray-500 mt-1">Internal name for your reference</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Target Audience <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="segmentId"
                                    value={formData.segmentId}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                                >
                                    <option value="">Select a Customer Segment</option>
                                    {segments.map((segment) => (
                                        <option key={segment.id} value={segment.id}>
                                            {segment.name} ({segment._count?.customers || 0} customers)
                                        </option>
                                    ))}
                                </select>
                                <div className="mt-2 text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 cursor-pointer hover:underline" onClick={() => router.push('/customers/segments/new')}>
                                    <Users className="w-3 h-3" />
                                    <span>Create a new segment</span>
                                </div>
                            </div>
                        </div>

                        {/* Email Content */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Email Content</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Subject Line <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                                    placeholder="e.g., Don't miss out on 50% off!"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email Body <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="content"
                                    value={formData.content}
                                    onChange={handleChange}
                                    required
                                    rows={10}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:font-mono dark:bg-gray-800 dark:text-white"
                                    placeholder="Write your email content here. HTML is supported."
                                />
                                <p className="text-xs text-gray-500 mt-1">Basic HTML is supported for formatting.</p>
                            </div>
                        </div>

                        {/* Scheduling */}
                        {/* <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Schedule (Optional)
                            </label>
                            <input
                                type="datetime-local"
                                name="scheduledAt"
                                value={formData.scheduledAt}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                            />
                            <p className="text-xs text-gray-500 mt-1">Leave blank to save as draft.</p>
                        </div> */}

                        {/* Actions */}
                        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                {loading ? 'Saving...' : 'Create Campaign'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </DashboardLayout>
    );
}
