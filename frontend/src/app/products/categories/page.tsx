'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { Trash, Tag } from 'lucide-react';

export default function CategoriesPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [newCategory, setNewCategory] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/categories', { name: newCategory });
            setNewCategory('');
            fetchCategories();
        } catch (err) {
            alert('Failed to create category');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            await api.delete(`/categories/${id}`);
            fetchCategories();
        } catch (err) {
            alert('Failed to delete category');
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                <header>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product Categories</h1>
                    <p className="text-gray-500 text-sm">Organize your products for the POS</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Create Category Form */}
                    <Card className="h-fit">
                        <h2 className="text-lg font-semibold mb-4">Add Category</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <Input
                                label="Category Name"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="e.g., Electronics"
                                required
                            />
                            <Button type="submit" className="w-full">Create Category</Button>
                        </form>
                    </Card>

                    {/* Categories List */}
                    <Card className="md:col-span-2">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Tag className="w-5 h-5 text-indigo-600" /> Existing Categories
                        </h2>
                        {loading ? (
                            <p className="text-gray-500">Loading...</p>
                        ) : categories.length === 0 ? (
                            <p className="text-gray-500 italic">No categories found.</p>
                        ) : (
                            <div className="space-y-2">
                                {categories.map((cat) => (
                                    <div key={cat.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{cat.name}</p>
                                            <p className="text-xs text-gray-400">{cat._count?.products || 0} products</p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(cat.id)}
                                            className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
