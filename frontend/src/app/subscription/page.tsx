'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Check, Star, Shield, Zap, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Toaster, toast } from 'react-hot-toast';

const PLANS = [
    {
        name: 'FREE',
        title: 'WELCOME PROMOTION',
        price: 0,
        period: '1 year',
        description: 'Special 1-Year Free Full Access Offer',
        features: [
            'All Premium Features Included',
            'Full POS System & Analytics',
            'Unlimited Transactions',
            'Priority Support for 12 Months',
            'Auto-renews to Basic'
        ],
        cta: 'Active Plan',
        popular: true, // Make it very visible
        color: 'bg-green-600'
    },
    {
        name: 'BASIC',
        price: 1500,
        period: 'month',
        description: 'For small businesses',
        features: [
            'Everything in Free',
            'Invoicing',
            'Basic Reports',
            'Custom M-Pesa API',
            '100 Transactions/mo',
            'Email Support'
        ],
        cta: 'Start Basic',
        popular: false,
        color: 'bg-blue-600'
    },
    {
        name: 'PRO',
        price: 2500,
        period: 'month',
        description: 'For detailed analytics',
        features: [
            'Everything in Basic',
            'Unlimited Transactions',
            '10 Branches',
            'Withdrawals',
            'Advanced Analytics',
            'Priority Support'
        ],
        cta: 'Go Pro',
        popular: true,
        color: 'bg-gradient-to-br from-purple-600 to-pink-600'
    },
    {
        name: 'ENTERPRISE',
        price: 75000,
        period: 'one-time',
        description: 'Full system ownership',
        features: [
            'Source Code',
            'Self-Hosted',
            'Custom Brand',
            'Custom M-Pesa API',
            'Lifetime Updates',
            'Dedicated Manager'
        ],
        cta: 'Contact Sales',
        popular: false,
        color: 'bg-indigo-900'
    }
];

export default function SubscriptionPage() {
    const router = useRouter();
    const { subscription, refreshSubscription } = useSubscription();
    const [processingPlan, setProcessingPlan] = useState<string | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [phoneNumber, setPhoneNumber] = useState('');

    const validateKenyanPhone = (phone: string): boolean => {
        const cleaned = phone.replace(/[\s-]/g, '');
        return /^(?:254|\+254|0)([17]\d{8})$/.test(cleaned);
    };

    const formatPhoneNumber = (phone: string): string => {
        const cleaned = phone.replace(/[\s-]/g, '');
        if (cleaned.startsWith('+254')) return cleaned.substring(1);
        if (cleaned.startsWith('0')) return '254' + cleaned.substring(1);
        return cleaned;
    };

    const handleUpgrade = (planName: string) => {
        if (planName === 'ENTERPRISE') {
            window.location.href = 'mailto:sales@mpesaconnect.co.ke?subject=Enterprise Plan Inquiry';
            return;
        }
        if (planName === 'FREE') return;
        setSelectedPlan(planName);
        setShowPaymentModal(true);
    };

    const handlePayment = async () => {
        if (!selectedPlan || !phoneNumber) {
            toast.error('Please enter your phone number');
            return;
        }

        if (!validateKenyanPhone(phoneNumber)) {
            toast.error('Invalid Phone Number');
            return;
        }

        setProcessingPlan(selectedPlan);
        const loadingToast = toast.loading('Sending STK Push...');

        try {
            const { initiateSubscriptionPayment } = await import('@/services/subscription.service');
            const formattedPhone = formatPhoneNumber(phoneNumber);

            await initiateSubscriptionPayment({
                plan: selectedPlan as any,
                phoneNumber: formattedPhone
            });

            toast.dismiss(loadingToast);
            toast.success('Check your phone for M-Pesa prompt!');
            setShowPaymentModal(false);
            setPhoneNumber('');

            setTimeout(() => refreshSubscription(), 5000);

        } catch (error: any) {
            console.error('Payment error:', error);
            toast.dismiss(loadingToast);
            toast.error(error.response?.data?.error || 'Payment Failed');
        } finally {
            setProcessingPlan(null);
        }
    };

    const currentPlan = subscription?.plan || 'FREE';

    return (
        <DashboardLayout>
            <div className="max-w-[1400px] mx-auto px-4 py-8">

                {/* Header Section */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
                        Upgrade Your Business
                    </h1>
                    <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
                        Choose the plan that fits your growth.
                    </p>
                    {subscription && (
                        <div className="mt-4 inline-flex items-center px-4 py-1.5 rounded-full bg-green-100 text-green-800 font-medium text-sm">
                            <Check className="w-4 h-4 mr-2" />
                            Active Plan: {currentPlan}
                        </div>
                    )}
                </div>

                {/* Pricing Grid - STRICT 4 COLUMNS on Desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-stretch">
                    {PLANS.map((plan) => {
                        const isCurrent = plan.name === currentPlan;

                        return (
                            <div
                                key={plan.name}
                                className={`relative flex flex-col rounded-2xl overflow-hidden transition-all duration-200 
                                    ${plan.popular ? 'ring-2 ring-purple-500 shadow-xl scale-100 md:-mt-4 md:mb-4 bg-white dark:bg-gray-800 z-10' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md'}
                                    ${isCurrent ? 'ring-2 ring-green-500 bg-green-50/50 dark:bg-green-900/10' : ''}
                                `}
                            >
                                {/* Popular Badge */}
                                {plan.popular && !isCurrent && (
                                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
                                )}
                                {plan.popular && !isCurrent && (
                                    <div className="absolute top-4 right-4 bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                                        Most Popular
                                    </div>
                                )}

                                {/* Active Plan Badge */}
                                {isCurrent && (
                                    <div className="absolute top-0 inset-x-0 h-1 bg-green-500" />
                                )}
                                {isCurrent && (
                                    <div className="absolute top-4 right-4 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Active
                                    </div>
                                )}

                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider">{(plan as any).title || plan.name}</h3>
                                    <p className="text-sm text-gray-500 mt-1 mb-4 h-5">{plan.description}</p>

                                    <div className="mb-6">
                                        <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                                            {plan.price === 0 ? 'Free' : `KES ${plan.price.toLocaleString()}`}
                                        </span>
                                        {plan.price > 0 && <span className="text-gray-500 text-sm font-medium">/{plan.period === 'one-time' ? 'lifetime' : 'mo'}</span>}
                                    </div>

                                    <div className="flex-1 space-y-3 mb-6">
                                        {plan.features.map((feat, i) => (
                                            <div key={i} className="flex items-start text-sm text-gray-600 dark:text-gray-300">
                                                <Check className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${isCurrent ? 'text-green-600' : plan.popular ? 'text-purple-500' : 'text-green-500'}`} />
                                                <span className="leading-tight">{feat}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        onClick={() => handleUpgrade(plan.name)}
                                        disabled={isCurrent}
                                        className={`w-full py-2 font-semibold shadow-none ${isCurrent
                                            ? 'bg-green-600 text-white cursor-default hover:bg-green-600'
                                            : plan.popular
                                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                                                : 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-700 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        {isCurrent ? 'Current Plan' : plan.cta}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* FAQ / Info */}
                <div className="mt-16 text-center max-w-3xl mx-auto">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Enterprise?</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Get the full source code and host it yourself. A one-time payment of 75,000 KES grants you full ownership, verified locally.
                    </p>
                </div>

                {/* Payment Modal */}
                {showPaymentModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl scale-100">
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold">Upgrade to {selectedPlan}</h3>
                                <p className="text-sm text-gray-500">M-Pesa Safe Payment</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">M-Pesa Phone Number</label>
                                    <input
                                        type="tel"
                                        placeholder="07..."
                                        className="w-full mt-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-mono text-lg"
                                        value={phoneNumber}
                                        onChange={e => setPhoneNumber(e.target.value)}
                                    />
                                </div>

                                <Button
                                    onClick={handlePayment}
                                    isLoading={!!processingPlan}
                                    className="w-full py-4 text-lg bg-green-600 hover:bg-green-700 text-white rounded-xl"
                                >
                                    Pay Now
                                </Button>

                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="w-full py-3 text-sm text-gray-400 hover:text-gray-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
