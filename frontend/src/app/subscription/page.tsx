'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PricingCard } from '@/components/subscription/PricingCard';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';

export default function SubscriptionPage() {
    const [subscription, setSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [paymentPhone, setPaymentPhone] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        try {
            const res = await api.get('/subscriptions');
            setSubscription(res.data);
        } catch (error) {
            console.error("Failed to load subscription", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPlan = (plan: string) => {
        setSelectedPlan(plan);
    };

    const handlePayment = async () => {
        if (!paymentPhone || !selectedPlan) return;
        setProcessing(true);
        try {
            await api.post('/subscriptions/pay', {
                plan: selectedPlan,
                phoneNumber: paymentPhone
            });
            alert("Subscription Activated Successfully!");
            setSelectedPlan(null);
            fetchSubscription(); // Refresh state
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.error || "Payment Failed");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <p className="text-gray-500">Loading subscription details...</p>
                </div>
            </DashboardLayout>
        );
    }

    const currentPlan = subscription?.plan || 'NONE';

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-8 pb-12">
                <header>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription & Billing</h1>
                    <p className="text-gray-500 text-sm">Manage your plan and billing details</p>
                </header>

                {/* Status Card */}
                <Card className="p-6 border-l-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                                Current Status: <span className="text-indigo-600">{subscription?.status || 'INACTIVE'}</span>
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Plan: <span className="font-bold">{currentPlan}</span>
                            </p>
                            {subscription?.daysRemaining !== undefined && (
                                <p className={`text-sm mt-2 font-medium ${subscription.daysRemaining < 3 ? 'text-red-500' : 'text-green-600'}`}>
                                    {subscription.daysRemaining > 0
                                        ? `${subscription.daysRemaining} days remaining`
                                        : `Expired ${Math.abs(subscription.daysRemaining)} days ago`
                                    }
                                </p>
                            )}
                        </div>
                        {currentPlan !== 'NONE' && (
                            <Button variant="outline" size="sm">Manage</Button>
                        )}
                    </div>
                </Card>

                {/* Plans Grid */}
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-8">
                    <PricingCard
                        title="Basic Plan"
                        price={1000}
                        features={[
                            'Up to 100 Transactions/mo',
                            'Basic Reporting',
                            'Email Support',
                            'Single User'
                        ]}
                        current={currentPlan === 'BASIC'}
                        onSelect={() => handleSelectPlan('BASIC')}
                    />
                    <PricingCard
                        title="Pro Plan"
                        price={2500}
                        recommended
                        features={[
                            'Unlimited Transactions',
                            'Advanced Analytics & PDF Reports',
                            'Priority Support',
                            'Multiple Users',
                            'Inventory Management'
                        ]}
                        current={currentPlan === 'PRO'}
                        onSelect={() => handleSelectPlan('PRO')}
                    />
                </div>
            </div>

            {/* Payment Modal */}
            <Modal isOpen={!!selectedPlan} onClose={() => setSelectedPlan(null)} title={`Upgrade to ${selectedPlan}`}>
                <div className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex gap-3 text-sm text-blue-700 dark:text-blue-300">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>
                            You will receive an M-Pesa STK push on your phone to complete the payment of
                            <strong> KES {selectedPlan === 'PRO' ? '2,500' : '1,000'}</strong>.
                        </p>
                    </div>

                    <Input
                        label="M-Pesa Phone Number"
                        placeholder="0712345678"
                        value={paymentPhone}
                        onChange={(e) => setPaymentPhone(e.target.value)}
                    />

                    <div className="flex gap-3 justify-end pt-4">
                        <Button variant="ghost" onClick={() => setSelectedPlan(null)}>Cancel</Button>
                        <Button
                            onClick={handlePayment}
                            isLoading={processing}
                            disabled={!paymentPhone || processing}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            Pay Now
                        </Button>
                    </div>
                </div>
            </Modal>


            {/* DEBUG SECTION - REMOVE BEFORE PROD */}
            <div className="fixed bottom-0 right-0 bg-black/80 text-green-400 p-2 text-xs font-mono rounded-tl-lg z-50">
                <p>UserID (Local): {JSON.parse(localStorage.getItem('user') || '{}').id || 'N/A'}</p>
                <p>SubStatus: {subscription?.status || 'NULL'}</p>
                <p>SubPlan: {subscription?.plan || 'NULL'}</p>
                <p>SubID: {subscription?.id || 'NULL'}</p>
                <p>FetchTime: {new Date().toLocaleTimeString()}</p>
            </div>
        </DashboardLayout >
    );
}
