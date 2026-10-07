'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CreditCard, ShieldCheck, Receipt, Settings } from 'lucide-react';
import Link from 'next/link';

export default function WithdrawalsPage() {
    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
                <Card className="p-8 text-center space-y-6 border-2 border-emerald-100 dark:border-emerald-900/30 bg-white dark:bg-zinc-900 shadow-sm">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                        <CreditCard className="w-8 h-8" />
                    </div>

                    <div className="space-y-2 max-w-lg mx-auto">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                            <ShieldCheck className="w-3.5 h-3.5" /> Instant Direct Settlement
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Withdrawal Requests Are Inactive
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            Because all customer payments deposit straight into your own Safaricom Paybill or Till account, you do not need to request withdrawals from the platform. Your funds are already in your account!
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto pt-2">
                        <Link href="/dashboard" className="w-full">
                            <Button variant="outline" className="w-full text-xs">
                                Back to Dashboard
                            </Button>
                        </Link>
                        <Link href="/sales" className="w-full">
                            <Button className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5">
                                <Receipt className="w-3.5 h-3.5" /> View Sales History
                            </Button>
                        </Link>
                        <Link href="/settings" className="w-full">
                            <Button variant="outline" className="w-full text-xs flex items-center justify-center gap-1.5">
                                <Settings className="w-3.5 h-3.5" /> M-Pesa API Settings
                            </Button>
                        </Link>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
