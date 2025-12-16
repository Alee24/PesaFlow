
'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AdminPage() {
    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                <header>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Portal</h1>
                    <p className="text-gray-500 text-sm">Platform Overview</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card title="Total Merchants" className="shadow-sm border border-gray-100 dark:border-gray-700">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">0</span>
                    </Card>
                    <Card title="Total Platform Revenue" className="shadow-sm border border-gray-100 dark:border-gray-700">
                        <span className="text-4xl font-bold text-green-600">KES 0.00</span>
                    </Card>
                    <Card title="Pending Withdrawals" className="shadow-sm border border-gray-100 dark:border-gray-700">
                        <span className="text-4xl font-bold text-orange-500">0</span>
                    </Card>
                </div>

                <Card title="Recent Withdrawal Requests" className="shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="text-center py-10 text-gray-500">
                        No pending requests.
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
