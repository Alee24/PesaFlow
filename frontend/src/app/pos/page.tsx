
'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';

export default function POSPage() {
    const [amount, setAmount] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCharge = async () => {
        setLoading(true);
        try {
            const res = await api.post('/mpesa/stk-push', {
                phoneNumber: phone,
                amount: amount
            });
            // In a real app, successful response means STK prompt was sent.
            // We would then poll for status or listen to websocket.
            console.log("STK Response:", res.data);
            alert(`STK Push sent to ${phone}! Check phone for prompt.`);

            // Clear cart/input
            setAmount('');
            setPhone('');
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.error || "Failed to initiate M-Pesa payment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
            <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center px-8">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">PayFlow POS</h1>
                <Link href="/dashboard">
                    <Button variant="ghost" size="sm">Exit POS</Button>
                </Link>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Product Grid */}
                <div className="w-2/3 p-6 overflow-y-auto">
                    <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Products</h2>
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Card key={i} className="cursor-pointer hover:shadow-2xl transition-all">
                                <div className="h-24 bg-gray-200 rounded-lg mb-2"></div>
                                <h3 className="font-medium">Product {i}</h3>
                                <p className="text-indigo-600 font-bold">KES {i * 100}</p>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Right: Cart & Checkout */}
                <div className="w-1/3 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 flex flex-col">
                    <h2 className="text-lg font-semibold mb-4">Current Sale</h2>

                    <div className="flex-1 space-y-4 mb-4 overflow-y-auto">
                        {/* Cart Items Helper */}
                        <div className="text-center text-gray-500 py-10">
                            Cart is empty
                        </div>
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span>KES {amount || '0.00'}</span>
                        </div>

                        <div className="space-y-2">
                            <Input
                                placeholder="Custom Amount"
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                            />
                            <Input
                                placeholder="Customer Phone (254...)"
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                            />
                        </div>

                        <Button
                            className="w-full py-4 text-lg"
                            onClick={handleCharge}
                            isLoading={loading}
                            disabled={!amount || !phone}
                        >
                            Charge via M-Pesa
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
