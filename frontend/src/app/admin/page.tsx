
'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';

export default function AdminPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <header>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Portal</h1>
                    <p className="text-gray-500">Platform Overview</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card title="Total Merchants">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">0</span>
                    </Card>
                    <Card title="Total Platform Revenue">
                        <span className="text-4xl font-bold text-green-600">KES 0.00</span>
                    </Card>
                    <Card title="Pending Withdrawals">
                        <span className="text-4xl font-bold text-orange-500">0</span>
                    </Card>
                </div>

                <Card title="Recent Withdrawal Requests">
                    <div className="text-center py-10 text-gray-500">
                        No pending requests.
                    </div>
                </Card>
            </div>
        </div>
    );
}
