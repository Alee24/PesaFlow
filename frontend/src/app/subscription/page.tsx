'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PricingCard } from '@/components/subscription/PricingCard';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { AlertCircle, CheckCircle, ShieldCheck, Zap, CreditCard, Clock } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface Subscription {
    id: string;
    plan: 'NONE' | 'BASIC' | 'PRO';
    status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'SUSPENDED';
    startDate?: string;
    endDate?: string;
    daysRemaining: number;
    canAccess: boolean;
    isInGracePeriod: boolean;
}

export default function SubscriptionPage() {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [paymentPhone, setPaymentPhone] = useState('');
    const [processing, setProcessing] = useState(false);
    const { showToast } = useToast();

    // Default to user's phone if available (would need context, but simplistic for now)

    useEffect(() => {
        fetchSubscription();
        const user = localStorage.getItem('user');
        if (user) {
            try {
                const u = JSON.parse(user);
                if (u.phoneNumber) setPaymentPhone(u.phoneNumber);
            } catch (e) { }
        }
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
        if (subscription?.plan === plan && subscription?.status === 'ACTIVE') {
            showToast('You are already subscribed to this plan', 'info');
            return;
        }
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
            showToast("Payment Initiated! Please check your phone for the M-Pesa prompt.", 'success');
            setSelectedPlan(null);
            // Optimistic update or wait a bit?
            // The backend prototype auto-activates, so refreshing immediately should work
            setTimeout(fetchSubscription, 2000);
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.error || "Payment Initiation Failed", 'error');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-96 space-y-4">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium">Loading subscription details...</p>
                </div>
            </DashboardLayout>
        );
    }

    const currentPlan = subscription?.plan || 'NONE';
    const isActive = subscription?.status === 'ACTIVE';

    // Calculate nice formatted date
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-10 pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                            Subscription & Billing
                            {isActive && <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold tracking-wide uppercase">Active</span>}
                        </h1>
                        <p className="text-gray-500 mt-2 text-lg">Manage your business plan and payment methods.</p>
                    </div>
                </div>

                {/* Hero Status Card */}
                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2 relative overflow-hidden text-white border-0 shadow-xl bg-gradient-to-br from-indigo-600 to-purple-700">
                        <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        <div className="relative p-8 z-10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <ShieldCheck className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-medium text-indigo-100 uppercase tracking-wider">Current Plan</h2>
                                    <p className="text-3xl font-bold">{currentPlan === 'NONE' ? 'Free Tier' : `${currentPlan} Plan`}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mt-8 border-t border-white/10 pt-8">
                                <div>
                                    <p className="text-indigo-200 text-sm mb-1">Status</p>
                                    <div className="flex items-center gap-2">
                                        {isActive ? (
                                            <CheckCircle className="w-5 h-5 text-green-400" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 text-yellow-400" />
                                        )}
                                        <span className="font-semibold">{subscription?.status || 'INACTIVE'}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-indigo-200 text-sm mb-1">Validity</p>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-indigo-300" />
                                        <span className="font-semibold">
                                            {subscription?.daysRemaining !== undefined && subscription.daysRemaining > 0
                                                ? `${subscription.daysRemaining} Days Remaining`
                                                : 'Expired'}
                                        </span>
                                    </div>
                                    {subscription?.endDate && (
                                        <p className="text-xs text-indigo-300 mt-1">Renews on {formatDate(subscription.endDate)}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="flex flex-col justify-center items-center p-8 bg-gray-50 dark:bg-gray-800 text-center border border-gray-100 dark:border-gray-700">
                        <Zap className="w-12 h-12 text-yellow-500 mb-4" />
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Need More Power?</h3>
                        <p className="text-gray-500 text-sm mt-2 mb-6">Upgrade to our Pro plan to unlock unlimited transactions and advanced analytics.</p>
                        <Button onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })} variant="outline" className="w-full">
                            View Plans
                        </Button>
                    </Card>
                </div>

                {/* Plans Grid */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Available Plans</h2>
                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <PricingCard
                            title="Basic Plan"
                            price={1000}
                            features={[
                                'Up to 100 Transactions/mo',
                                'Basic Reporting',
                                'Email Support',
                                'Single User',
                                'Standard Analytics'
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
                                'Priority Support (24/7)',
                                'Multiple Users (Coming Soon)',
                                'Inventory Management',
                                'API Access'
                            ]}
                            current={currentPlan === 'PRO'}
                            onSelect={() => handleSelectPlan('PRO')}
                        />
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            <Modal isOpen={!!selectedPlan} onClose={() => setSelectedPlan(null)} title={`Subscribe to ${selectedPlan}`}>
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-900/50">
                        <div className="flex gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg h-fit">
                                <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-1">Confirm Payment</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                    You are about to subscribe to the <strong>{selectedPlan} Plan</strong>.
                                    A request will be sent to your M-Pesa number to pay
                                    <strong className="text-indigo-600 dark:text-indigo-400"> KES {selectedPlan === 'PRO' ? '2,500' : '1,000'}</strong>.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Input
                            label="M-Pesa Phone Number"
                            placeholder="0712345678"
                            value={paymentPhone}
                            onChange={(e) => setPaymentPhone(e.target.value)}
                            className="text-lg tracking-wide"
                        />
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Secure payment via Safaricom M-Pesa
                        </p>
                    </div>

                    <div className="flex gap-3 justify-end pt-6 border-t dark:border-gray-700">
                        <Button variant="ghost" onClick={() => setSelectedPlan(null)}>Cancel</Button>
                        <Button
                            onClick={handlePayment}
                            isLoading={processing}
                            disabled={!paymentPhone || processing}
                            className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
                        >
                            {processing ? 'Processing...' : 'Pay Now'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
