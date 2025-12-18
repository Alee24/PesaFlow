
'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Tag, Trash2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface Product {
    id: string;
    name: string;
    price: string;
    stockQuantity: number;
    status: string;
    imageUrl?: string;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        elementId: '',
        loading: false
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteModal.elementId) return;
        setDeleteModal(prev => ({ ...prev, loading: true }));
        try {
            await api.delete(`/products/${deleteModal.elementId}`);
            showToast('Product deleted successfully', 'success');
            fetchProducts();
            setDeleteModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
            console.error(error);
            showToast('Failed to delete product', 'error');
        } finally {
            setDeleteModal(prev => ({ ...prev, loading: false }));
        }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteModal({ isOpen: true, elementId: id, loading: false });
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
                        <p className="text-gray-500 text-sm">Manage your inventory</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/products/categories">
                            <Button variant="outline" className="flex items-center gap-2">
                                <Tag className="w-4 h-4" /> Manage Categories
                            </Button>
                        </Link>
                        <Link href="/products/new">
                            <Button className="shadow-lg shadow-indigo-200 dark:shadow-none">+ Add Product</Button>
                        </Link>
                    </div>
                </header>

                <Card className="border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                    <th className="py-4 px-6 text-gray-500 font-semibold">Product</th>
                                    <th className="py-4 px-6 text-gray-500 font-semibold">Price (KES)</th>
                                    <th className="py-4 px-6 text-gray-500 font-semibold">Stock</th>
                                    <th className="py-4 px-6 text-gray-500 font-semibold">Status</th>
                                    <th className="py-4 px-6 text-gray-500 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} className="text-center py-12 text-gray-500">Loading products...</td></tr>
                                ) : products.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-12 text-gray-500">No products found. Add one to get started!</td></tr>
                                ) : (
                                    products.map((product) => (
                                        <tr key={product.id} className="border-b dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700">
                                                        {product.imageUrl ? (
                                                            <img src={product.imageUrl} className="h-full w-full object-cover" alt="" />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full text-gray-400">
                                                                <Tag className="w-4 h-4" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span>{product.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">KES {product.price}</td>
                                            <td className="py-4 px-6">{product.stockQuantity}</td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${product.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {product.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <Link href={`/products/${product.id}`}>
                                                    <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">Edit</Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                                                    onClick={() => handleDeleteClick(product.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDelete}
                title="Delete Product"
                description="Are you sure you want to delete this product? This action cannot be undone."
                variant="danger"
                loading={deleteModal.loading}
                confirmText="Delete"
            />
        </DashboardLayout>
    );
}
