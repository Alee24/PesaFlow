'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function NotificationsPage() {
    // Mock notifications for now as we don't have a backend table for this yet
    const notifications = [
        {
            id: 1,
            title: 'Welcome to PesaFlow!',
            message: 'Your account has been successfully created. Start by setting up your business profile.',
            type: 'info',
            date: 'Just now'
        },
        {
            id: 2,
            title: 'System Update',
            message: 'We have updated the invoicing system with new templates.',
            type: 'success',
            date: '2 hours ago'
        }
    ];

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto py-8">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
                        <p className="text-gray-500">Stay updated with system activities.</p>
                    </div>
                    <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                        Mark all as read
                    </button>
                </header>

                <div className="space-y-4">
                    {notifications.length > 0 ? (
                        notifications.map((note) => (
                            <Card key={note.id} className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">
                                        {getIcon(note.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-semibold text-gray-900">{note.title}</h3>
                                            <span className="text-xs text-gray-400">{note.date}</span>
                                        </div>
                                        <p className="text-gray-600 text-sm mt-1">{note.message}</p>
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-20 text-gray-400">
                            <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No new notifications</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
