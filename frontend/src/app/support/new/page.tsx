'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function NewTicketPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        priority: 'MEDIUM',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/support', formData);
            toast.success('Ticket created successfully!');
            router.push('/support');
        } catch (error: any) {
            console.error("Failed to create ticket:", error);
            const errorMessage = error.response?.data?.details || error.response?.data?.error || error.message || 'Unknown error';
            toast.error(`Error: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto px-4 py-8">
                <Link href="/support" className="inline-flex items-center text-gray-500 hover:text-indigo-600 mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Tickets
                </Link>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Ticket</h1>
                        <p className="text-gray-500 mt-1">Describe your issue and we'll get back to you.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Subject
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="E.g., Payment Issue"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Priority
                            </label>
                            <div className="grid grid-cols-3 gap-4">
                                {['LOW', 'MEDIUM', 'HIGH'].map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, priority: p })}
                                        className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${formData.priority === p
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'
                                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Message
                            </label>
                            <textarea
                                required
                                rows={6}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                                placeholder="Describe your issue in detail..."
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            />
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                isLoading={loading}
                                className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700"
                            >
                                <Send className="w-5 h-5 mr-2" />
                                Submit Ticket
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
