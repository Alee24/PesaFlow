
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/auth/login');
            return;
        }
        setUser(JSON.parse(userData));
    }, [router]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                        <p className="text-gray-500">Welcome back, {user.email}</p>
                    </div>
                    <div className="flex gap-4">
                        <Link href="/pos">
                            <Button>Open POS System</Button>
                        </Link>
                        <Button variant="outline" onClick={() => {
                            localStorage.clear();
                            router.push('/auth/login');
                        }}>Logout</Button>
                    </div>
                </header>

                <nav className="flex gap-4 overflow-x-auto pb-2">
                    <Link href="/dashboard"><Button variant="secondary" size="sm">Overview</Button></Link>
                    <Link href="/products"><Button variant="ghost" size="sm">Products</Button></Link>
                    <Link href="/transactions"><Button variant="ghost" size="sm">Transactions</Button></Link>
                    <Link href="/withdrawals"><Button variant="ghost" size="sm">Withdrawals</Button></Link>
                </nav>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card title="Wallet Balance" className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none">
                        <div className="mt-2">
                            <span className="text-4xl font-bold">KES 0.00</span>
                            <p className="text-indigo-100 text-sm mt-1">Available for withdrawal</p>
                        </div>
                    </Card>

                    <Card title="Today's Sales">
                        <div className="mt-2">
                            <span className="text-4xl font-bold text-gray-900 dark:text-white">KES 0.00</span>
                            <p className="text-gray-500 text-sm mt-1">0 Transactions</p>
                        </div>
                    </Card>

                    <Card title="Total Revenue">
                        <div className="mt-2">
                            <span className="text-4xl font-bold text-gray-900 dark:text-white">KES 0.00</span>
                            <p className="text-green-500 text-sm mt-1 flex items-center">
                                +0% from last month
                            </p>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card title="Recent Transactions">
                        <div className="text-center py-10 text-gray-500">
                            No transactions yet. Start selling!
                        </div>
                    </Card>

                    <Card title="Product Quick Access">
                        <div className="space-y-4">
                            <Button variant="secondary" className="w-full justify-start">
                                + Add New Product
                            </Button>
                            <Button variant="secondary" className="w-full justify-start">
                                All Products
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
