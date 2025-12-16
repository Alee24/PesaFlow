
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';

export default function NewProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        stockQuantity: '',
        sku: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/products', formData);
            router.push('/products');
        } catch (error) {
            console.error(error);
            alert('Failed to create product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto space-y-8">
                <header>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Product</h1>
                </header>

                <Card className="shadow-lg border border-gray-100 dark:border-gray-700">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Product Name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Price (KES)"
                                type="number"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                required
                            />
                            <Input
                                label="Stock Quantity"
                                type="number"
                                value={formData.stockQuantity}
                                onChange={e => setFormData({ ...formData, stockQuantity: e.target.value })}
                            />
                        </div>

                        <Input
                            label="SKU (Optional)"
                            value={formData.sku}
                            onChange={e => setFormData({ ...formData, sku: e.target.value })}
                        />

                        <div className="flex gap-4 pt-4">
                            <Button type="submit" isLoading={loading} className="w-full">Create Product</Button>
                            <Button type="button" variant="ghost" className="w-full" onClick={() => router.back()}>Cancel</Button>
                        </div>
                    </form>
                </Card>
            </div>
        </DashboardLayout>
    );
}
