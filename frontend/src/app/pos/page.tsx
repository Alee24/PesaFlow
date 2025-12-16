
'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Trash2, Plus, Minus } from 'lucide-react';

interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
}

export default function POSPage() {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    // Mock Products (In real app, fetch from API)
    const products = Array.from({ length: 9 }).map((_, i) => ({
        id: i + 1,
        name: `Product Item ${i + 1}`,
        price: (i + 1) * 150
    }));

    const addToCart = (product: { id: number; name: string; price: number }) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: number) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newQuantity = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    };

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleCharge = async () => {
        if (!phone || totalAmount === 0) return;

        setLoading(true);
        try {
            const res = await api.post('/mpesa/stk-push', {
                phoneNumber: phone,
                amount: totalAmount,
                items: cart.map(item => ({
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                }))
            });
            console.log("STK Response:", res.data);
            alert(`STK Push sent to ${phone} for KES ${totalAmount}! Check phone for prompt.`);
            setCart([]);
            setPhone('');
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.error || "Failed to initiate M-Pesa payment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full h-[calc(100vh-100px)]">
                <header className="mb-4 flex justify-between items-center shrink-0">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">POS System</h1>
                </header>

                <div className="flex-1 flex overflow-hidden gap-6">
                    {/* Left: Product Grid */}
                    <div className="w-2/3 overflow-y-auto pr-2 pb-4">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {products.map((product) => (
                                <Card
                                    key={product.id}
                                    className="cursor-pointer hover:shadow-lg transition-all hover:border-indigo-500 border border-transparent group"
                                    onClick={() => addToCart(product)}
                                >
                                    <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors">
                                        <span className="text-4xl">📦</span>
                                    </div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">{product.name}</h3>
                                    <p className="text-indigo-600 font-bold mt-1">KES {product.price.toLocaleString()}</p>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Right: Cart & Checkout */}
                    <Card className="w-1/3 flex flex-col h-full border-l dark:border-gray-700 rounded-none md:rounded-xl">
                        <h2 className="text-lg font-semibold mb-4 pb-2 border-b dark:border-gray-700 shrink-0">Current Sale</h2>

                        <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <span className="text-5xl mb-4">🛒</span>
                                    <p>Cart is empty</p>
                                    <p className="text-sm">Select products to add</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-lg group">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">{item.name}</h4>
                                            <div className="text-xs text-gray-500 mt-1">
                                                KES {item.price} x {item.quantity}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="ml-2 text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="ml-3 font-semibold text-sm">
                                            {(item.price * item.quantity).toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="space-y-4 border-t dark:border-gray-700 pt-4 mt-4 shrink-0">
                            <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white">
                                <span>Total</span>
                                <span>KES {totalAmount.toLocaleString()}</span>
                            </div>

                            <div className="space-y-3">
                                <Input
                                    label="Customer Phone"
                                    placeholder="2547..."
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                />
                            </div>

                            <Button
                                className="w-full py-6 text-lg shadow-lg shadow-indigo-200 dark:shadow-none font-bold"
                                onClick={handleCharge}
                                isLoading={loading}
                                disabled={cart.length === 0 || !phone}
                            >
                                {cart.length === 0 ? 'Add Items to Cart' : `Charge KES ${totalAmount.toLocaleString()}`}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
