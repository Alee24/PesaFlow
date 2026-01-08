'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Check, TrendingUp, Zap, Users, Lock, Infinity as InfinityIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/contexts/SubscriptionContext';

const PLANS = [
    {
        name: 'FREE',
        price: 0,
        period: 'forever',
        description: 'Perfect for getting started',
        features: [
            'POS System',
            'Inventory Management',
            'Unlimited transactions',
            'Basic support'
        ],
        limitations: [
            'No invoices',
            'No withdrawals',
            'No team management',
            'No reports'
        ],
        cta: 'Current Plan',
        popular: false,
        gradient: 'from-gray-500 to-slate-600'
    },
    {
        name: 'BASIC',
        price: 1500,
        period: 'month',
        description: 'For small businesses',
        features: [
            'Everything in FREE',
            'Invoice Management',
            'Basic Reports',
            '100 transactions/month',
            'Email support'
        ],
        limitations: [
            'No withdrawals',
            'No team management',
            'No advanced analytics'
        ],
        cta: 'Upgrade to BASIC',
        popular: false,
        gradient: 'from-blue-500 to-cyan-600'
    },
    {
        name: 'PRO',
        price: 2500,
        period: 'month',
        description: 'For growing businesses',
        features: [
            'Everything in BASIC',
            'Unlimited transactions',
            'Up to 10 branches',
            'Withdrawal management',
            'Advanced analytics',
            'Priority support'
        ],
        limitations: [],
        cta: 'Upgrade to PRO',
        popular: true,
        gradient: 'from-purple-500 to-pink-600'
    },
    {
        name: 'ENTERPRISE',
        price: 75000,
        period: 'one-time',
        description: 'Full system ownership',
        features: [
            'Everything in PRO',
            'Unlimited branches',
            'Custom branding',
            'Self-hosted deployment',
            '1 year support included',
            'Lifetime updates',
            'Dedicated account manager'
        ],
        limitations: [],
        cta: 'Contact Sales',
        popular: false,
        gradient: 'from-indigo-500 to-purple-600'
    }
];

export default function SubscriptionPage() {
    const router = useRouter();
    const { subscription, loading, refreshSubscription } = useSubscription();
    const [processingPlan, setProcessingPlan] = useState<string | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [phoneNumber, setPhoneNumber] = useState('');

    // Validate Kenyan phone number format
    const validateKenyanPhone = (phone: string): boolean => {
        // Remove spaces and dashes
        const cleaned = phone.replace(/[\s-]/g, '');

        // Accept formats: 0712345678, 254712345678, +254712345678
        const kenyanPhoneRegex = /^(?:254|\+254|0)([17]\d{8})$/;
        return kenyanPhoneRegex.test(cleaned);
    };

    const formatPhoneNumber = (phone: string): string => {
        const cleaned = phone.replace(/[\s-]/g, '');
        if (cleaned.startsWith('+254')) return cleaned.substring(1);
        if (cleaned.startsWith('0')) return '254' + cleaned.substring(1);
        return cleaned;
    };

    const handleUpgrade = async (planName: string) => {
        if (planName === 'ENTERPRISE') {
            window.location.href = 'mailto:sales@mpesaconnect.co.ke?subject=Enterprise Plan Inquiry';
            return;
        }

        if (planName === 'FREE') {
            return;
        }

        setSelectedPlan(planName);
        setShowPaymentModal(true);
    };

    const handlePayment = async () => {
        if (!selectedPlan || !phoneNumber) {
            alert('Please enter your phone number');
            return;
        }

        if (!validateKenyanPhone(phoneNumber)) {
            alert('Please enter a valid Kenyan phone number (e.g., 0712345678)');
            return;
        }

        setProcessingPlan(selectedPlan);

        try {
            const { initiateSubscriptionPayment } = await import('@/services/subscription.service');

            const formattedPhone = formatPhoneNumber(phoneNumber);

            const result = await initiateSubscriptionPayment({
                plan: selectedPlan as any,
                phoneNumber: formattedPhone
            });

            alert('Payment request sent to your phone. Please enter your M-Pesa PIN.');

            setShowPaymentModal(false);
            setPhoneNumber('');

            // Refresh subscription after delay
            setTimeout(() => {
                refreshSubscription();
            }, 5000);

        } catch (error: any) {
            console.error('Payment error:', error);
            alert(error.response?.data?.error || 'Failed to initiate payment');
        } finally {
            setProcessingPlan(null);
        }
    };

    const currentPlan = subscription?.plan || 'FREE';

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Choose Your Plan
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400">
                        Unlock powerful features and grow your business
                    </p>
                    {subscription && (
                        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                            <span className="text-sm text-blue-700 dark:text-blue-300">
                                Current Plan: <strong>{currentPlan}</strong>
                            </span>
                        </div>
                    )}
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {PLANS.map((plan) => {
                        const isCurrentPlan = plan.name === currentPlan;
                        const canUpgrade = !isCurrentPlan && plan.name !== 'FREE';

                        return (
                            <Card
                                key={plan.name}
                                className={`relative overflow-hidden ${plan.popular ? 'ring-2 ring-purple-500 shadow-2xl scale-105' : ''}`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                        POPULAR
                                    </div>
                                )}

                                <div className="p-6">
                                    {/* Plan Name */}
                                    <div className={`inline-block bg-gradient-to-r ${plan.gradient} text-white px-3 py-1 rounded-lg text-sm font-bold mb-4`}>
                                        {plan.name}
                                    </div>

                                    {/* Price */}
                                    <div className="mb-4">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                                {plan.price === 0 ? 'Free' : `KES ${plan.price.toLocaleString()}`}
                                            </span>
                                            {plan.price > 0 && (
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    /{plan.period}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                            {plan.description}
                                        </p>
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-3 mb-6">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA Button */}
                                    <Button
                                        onClick={() => handleUpgrade(plan.name)}
                                        disabled={isCurrentPlan || processingPlan === plan.name}
                                        isLoading={processingPlan === plan.name}
                                        className={`w-full ${isCurrentPlan ? 'bg-gray-300 cursor-not-allowed' : `bg-gradient-to-r ${plan.gradient}`}`}
                                    >
                                        {isCurrentPlan ? 'Current Plan' : plan.cta}
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* FAQ Section */}
                <Card className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                Can I change my plan later?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                What happens when I reach the transaction limit?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                On the BASIC plan, you're limited to 100 transactions per month. Upgrade to PRO for unlimited transactions.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                How does the ENTERPRISE plan work?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                ENTERPRISE is a one-time purchase of 75,000 KSh. You get the full system installed on your own server with 1 year of support and lifetime updates.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedPlan && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Upgrade to {selectedPlan}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Enter your M-Pesa phone number to complete payment
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="0712345678"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                You will receive an M-Pesa prompt on this number
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowPaymentModal(false);
                                    setPhoneNumber('');
                                }}
                                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePayment}
                                disabled={!phoneNumber || processingPlan === selectedPlan}
                                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processingPlan === selectedPlan ? 'Processing...' : 'Pay Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
