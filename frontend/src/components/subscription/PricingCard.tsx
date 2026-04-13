'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '../ui/Button';

interface PricingCardProps {
    title: string;
    price: number;
    features: string[];
    recommended?: boolean;
    current?: boolean;
    onSelect: () => void;
    loading?: boolean;
}

export const PricingCard = ({ title, price, features, recommended, current, onSelect, loading }: PricingCardProps) => {
    return (
        <div className={`relative p-8 bg-white dark:bg-gray-800 rounded-2xl border transition-all duration-200 
            ${recommended ? 'border-indigo-500 shadow-xl scale-105 z-10' : 'border-gray-200 dark:border-gray-700 shadow-sm hover:border-indigo-200'}
        `}>
            {recommended && (
                <div className="absolute top-0 right-0 left-0 -mt-4 flex justify-center">
                    <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                        Most Popular
                    </span>
                </div>
            )}

            <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white">KES {price.toLocaleString()}</span>
                    <span className="text-sm text-gray-500">/mo</span>
                </div>
            </div>

            <ul className="space-y-4 mb-8">
                {features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                        <div className={`p-1 rounded-full ${recommended ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                            <Check className="w-3 h-3" />
                        </div>
                        {feature}
                    </li>
                ))}
            </ul>

            <Button
                onClick={onSelect}
                isLoading={loading}
                disabled={current}
                variant={recommended ? 'primary' : 'outline'}
                className="w-full"
            >
                {current ? 'Current Plan' : 'Choose Plan'}
            </Button>
        </div>
    );
};
