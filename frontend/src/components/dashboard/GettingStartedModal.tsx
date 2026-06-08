'use client';

import React, { useState, useEffect } from 'react';
import { Store, CreditCard, Package, ShoppingCart, FileText, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export function GettingStartedModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const hasSeenGuide = localStorage.getItem('has_seen_guide');
        if (!hasSeenGuide) {
            // Slight delay so the dashboard loads first
            const timer = setTimeout(() => setIsOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('has_seen_guide', 'true');
    };

    const handleSkip = () => {
        handleClose();
    };

    if (!isMounted || !isOpen) return null;

    const steps = [
        {
            id: 'profile',
            title: 'Welcome to Mpesa Connect! 🎉',
            description: 'Let\'s get your account fully set up so you can start managing your business effectively. First up: personalize your account.',
            icon: <Store className="w-12 h-12 text-indigo-500 mb-4" />,
            actionLabel: 'Go to Settings',
            actionUrl: '/settings',
            instructions: [
                'Navigate to the Settings page.',
                'Upload your Company Logo and a Favicon.',
                'Update your contact details (phone, email, website).'
            ]
        },
        {
            id: 'payments',
            title: 'Configure Payments 💳',
            description: 'Accept digital payments seamlessly by connecting your M-Pesa account or using our built-in treasury.',
            icon: <CreditCard className="w-12 h-12 text-blue-500 mb-4" />,
            actionLabel: 'Setup M-Pesa',
            actionUrl: '/settings',
            instructions: [
                'In the Settings page, scroll down to "M-Pesa Payments Integration".',
                'Choose "Own API Credentials" to link your Paybill/Till.',
                'Enter your Daraja API keys for automatic STK pushes.'
            ]
        },
        {
            id: 'products',
            title: 'Add Your First Product 📦',
            description: 'Your store needs items to sell! Let\'s populate your inventory.',
            icon: <Package className="w-12 h-12 text-emerald-500 mb-4" />,
            actionLabel: 'Go to Products',
            actionUrl: '/products',
            instructions: [
                'Click on the "Products" menu in the sidebar.',
                'Click "Add Product" at the top right.',
                'Fill in the name, price, and stock quantity.'
            ]
        },
        {
            id: 'pos',
            title: 'Make Your First Sale 🛒',
            description: 'Time to ring up a customer using our intuitive Point of Sale (POS) system.',
            icon: <ShoppingCart className="w-12 h-12 text-orange-500 mb-4" />,
            actionLabel: 'Open POS',
            actionUrl: '/pos',
            instructions: [
                'Click on "POS" in the sidebar.',
                'Click on the products to add them to the cart.',
                'Click "Checkout" and choose Cash or M-Pesa as the payment method.'
            ]
        },
        {
            id: 'invoices',
            title: 'Generate an Invoice 📄',
            description: 'Send professional invoices directly to your clients.',
            icon: <FileText className="w-12 h-12 text-purple-500 mb-4" />,
            actionLabel: 'Create Invoice',
            actionUrl: '/invoices/new',
            instructions: [
                'Click "Invoices" in the sidebar.',
                'Click "Create Invoice".',
                'Add a customer from your CRM, add line items, and click "Save & Print".'
            ]
        }
    ];

    const step = steps[currentStep];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button 
                    onClick={handleSkip}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 flex">
                    {steps.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`h-full flex-1 transition-all duration-300 ${idx <= currentStep ? 'bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.8)]' : 'bg-transparent'}`} 
                        />
                    ))}
                </div>

                <div className="p-8 md:p-12 flex flex-col items-center text-center">
                    <div key={step.id} className="animate-in slide-in-from-right-8 duration-500 fade-in flex flex-col items-center w-full">
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-full mb-6">
                            {step.icon}
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
                            {step.title}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md text-base leading-relaxed">
                            {step.description}
                        </p>

                        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 w-full text-left mb-8 shadow-sm">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 uppercase text-xs tracking-wider">How to do it</h3>
                            <ul className="space-y-4">
                                {step.instructions.map((inst, i) => (
                                    <li key={i} className="flex items-start gap-4 text-sm text-gray-700 dark:text-gray-300">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold mt-0.5 shadow-inner">
                                            {i + 1}
                                        </div>
                                        <span className="leading-relaxed">{inst}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <div className="w-full flex justify-center mb-4">
                            <Link href={step.actionUrl} onClick={handleClose}>
                                <Button variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                                    {step.actionLabel}
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="w-full flex items-center justify-between mt-auto pt-6 border-t border-gray-100 dark:border-gray-800">
                        <button 
                            onClick={handleSkip}
                            className="text-sm font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            Skip Tour
                        </button>
                        
                        <div className="flex items-center gap-3">
                            {currentStep > 0 && (
                                <Button variant="ghost" onClick={() => setCurrentStep(prev => prev - 1)} className="text-gray-600">
                                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                                </Button>
                            )}
                            
                            {currentStep < steps.length - 1 ? (
                                <Button onClick={() => setCurrentStep(prev => prev + 1)} className="bg-indigo-600 hover:bg-indigo-700 shadow-md">
                                    Next <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            ) : (
                                <Button onClick={handleClose} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30">
                                    Let's Go! 🚀
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
