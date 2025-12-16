
'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import api from '@/lib/api';

interface Product {
    id: string;
    name: string;
    price: string;
    stockQuantity: number;
    status: string;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
                        <p className="text-gray-500">Manage your inventory</p>
                    </div>
                    <Link href="/products/new">
                        <Button>+ Add Product</Button>
                    </Link>
                </header>

                <nav className="flex gap-4 overflow-x-auto pb-2">
                    <Link href="/dashboard"><Button variant="ghost" size="sm">Overview</Button></Link>
                    <Link href="/products"><Button variant="secondary" size="sm">Products</Button></Link>
                    <Link href="/transactions"><Button variant="ghost" size="sm">Transactions</Button></Link>
                    <Link href="/withdrawals"><Button variant="ghost" size="sm">Withdrawals</Button></Link>
                </nav>

                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b dark:border-gray-700">
                                    <th className="py-4 px-6 text-gray-500 font-medium">Name</th>
                                    <th className="py-4 px-6 text-gray-500 font-medium">Price (KES)</th>
                                    <th className="py-4 px-6 text-gray-500 font-medium">Stock</th>
                                    <th className="py-4 px-6 text-gray-500 font-medium">Status</th>
                                    <th className="py-4 px-6 text-gray-500 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
                                ) : products.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-8 text-gray-500">No products found. Add one!</td></tr>
                                ) : (
                                    products.map((product) => (
                                        <tr key={product.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="py-4 px-6 font-medium">{product.name}</td>
                                            <td className="py-4 px-6">KES {product.price}</td>
                                            <td className="py-4 px-6">{product.stockQuantity}</td>
                                            <td className="py-4 px-6">
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    {product.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <Button variant="ghost" size="sm">Edit</Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
