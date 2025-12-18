
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';

import { useToast } from '@/contexts/ToastContext';
// ... imports
import { useEffect } from 'react';

export default function NewProductPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        stockQuantity: '',
        sku: '',
        description: '',
        imageUrl: '',
        categoryId: ''
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/categories');
                setCategories(res.data);
            } catch (err) {
                console.error("Failed to load categories");
            }
        };
        fetchCategories();
    }, []);

    const [imageFile, setImageFile] = useState<File | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("File size too large. Max 5MB.");
                return;
            }
            setImageFile(file);

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = new FormData();
            payload.append('name', formData.name);
            payload.append('price', formData.price);
            payload.append('stockQuantity', formData.stockQuantity);
            payload.append('sku', formData.sku);
            payload.append('description', formData.description);

            if (formData.categoryId) {
                payload.append('categoryId', formData.categoryId);
            }

            // Append file if exists, otherwise URL if manually entered (though we hidden manual input, let's support legacy URL if ever needed or from preview if we want to change behavior later, but for now file is priority)
            if (imageFile) {
                payload.append('image', imageFile);
            }

            await api.post('/products', payload);
            showToast('Product created successfully', 'success');
            setTimeout(() => router.push('/products'), 500);
        } catch (error) {
            console.error(error);
            showToast('Failed to create product', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto space-y-8 pb-12">
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

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-white h-24"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Product details..."
                            />
                        </div>

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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                                    value={formData.categoryId}
                                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <Input
                                label="SKU (Optional)"
                                value={formData.sku}
                                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                            />
                        </div>

                        <div className="flex flex-col space-y-2 mt-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Product Image</label>
                            <div className="flex items-start gap-4 flex-col sm:flex-row">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="block w-full text-sm text-gray-500
                                         file:mr-4 file:py-2 file:px-4
                                         file:rounded-full file:border-0
                                         file:text-sm file:font-semibold
                                         file:bg-indigo-50 file:text-indigo-700
                                         hover:file:bg-indigo-100"
                                />
                                {formData.imageUrl && (
                                    <div className="relative h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden border bg-gray-50">
                                        <img src={formData.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-400">Supported: JPG, PNG. Max 5MB.</p>
                        </div>

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
