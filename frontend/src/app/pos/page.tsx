
'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProductGrid from '@/components/pos/ProductGrid';
import CartSidebar from '@/components/pos/CartSidebar';
import PaymentModal from '@/components/pos/PaymentModal';
import { ReceiptModal } from '@/components/pos/ReceiptModal';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

interface Product {
    id: string;
    name: string;
    price: string | number;
    stockQuantity: number;
    imageUrl?: string;
    categoryId?: string;
    sku?: string;
    barcode?: string;
}

interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
}

interface Category {
    id: string;
    name: string;
    _count?: { products: number };
}

export default function POSPage() {
    const { showToast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [lastSale, setLastSale] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [discountData, setDiscountData] = useState<{ discountType: 'PERCENTAGE' | 'FIXED', discountValue: number } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                api.get('/products'),
                api.get('/categories')
            ]);
            setProducts(productsRes.data);
            setCategories(categoriesRes.data);
        } catch (error) {
            console.error(error);
            showToast('Failed to load data', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // ... (rest of cart logic same as before) ...

    const addToCart = (product: Product) => {
        // ... existing logic ...
        setCartItems(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) {
                if (existing.quantity >= product.stockQuantity) {
                    showToast(`Only ${product.stockQuantity} in stock!`, 'error');
                    return prev;
                }
                return prev.map(item =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, {
                productId: product.id,
                name: product.name,
                price: Number(product.price),
                quantity: 1,
                imageUrl: product.imageUrl
            }];
        });
    };

    // ... updateQuantity, removeItem, handleCheckoutSuccess, totalAmount ...

    const updateQuantity = (productId: string, delta: number) => {
        setCartItems(prev => {
            return prev.map(item => {
                if (item.productId === productId) {
                    const newQty = Math.max(1, item.quantity + delta);
                    const product = products.find(p => p.id === productId);
                    if (delta > 0 && product && newQty > product.stockQuantity) {
                        showToast(`Only ${product.stockQuantity} in stock!`, 'error');
                        return item;
                    }
                    return { ...item, quantity: newQty };
                }
                return item;
            });
        });
    };

    const removeItem = (productId: string) => {
        setCartItems(prev => prev.filter(item => item.productId !== productId));
    };

    const handleCheckout = (data: any) => {
        setDiscountData({
            discountType: data.discountType,
            discountValue: data.discountValue
        });
        setIsPaymentOpen(true);
    };

    const handleCheckoutSuccess = (sale: any) => {
        setIsPaymentOpen(false);
        setCartItems([]);
        setLastSale(sale);
        // showToast('Sale completed successfully!', 'success'); // Receipt modal is confirmation enough
        fetchData(); // Refresh stock
    };

    // Recalculate total with discount for Modal
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalAmount = discountData
        ? Math.max(0, subtotal - (discountData.discountType === 'PERCENTAGE' ? (subtotal * discountData.discountValue / 100) : discountData.discountValue))
        : subtotal;

    return (
        <DashboardLayout>
            <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden bg-gray-50/50 dark:bg-gray-900/50">
                {/* Main Product Area */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-hidden">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : (
                            <ProductGrid
                                products={products}
                                categories={categories}
                                onAddToCart={addToCart}
                            />
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="w-full md:w-96 h-full z-10 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
                    <CartSidebar
                        cartItems={cartItems}
                        onUpdateQuantity={updateQuantity}
                        onRemoveItem={removeItem}
                        onClearCart={() => setCartItems([])}
                        onCheckout={handleCheckout}
                    />
                </div>
            </div>

            {isPaymentOpen && (
                <PaymentModal
                    items={cartItems}
                    totalAmount={totalAmount}
                    discountType={discountData?.discountType}
                    discountValue={discountData?.discountValue}
                    onClose={() => setIsPaymentOpen(false)}
                    onSuccess={handleCheckoutSuccess}
                />
            )}

            {lastSale && (
                <ReceiptModal
                    sale={lastSale}
                    onClose={() => setLastSale(null)}
                />
            )}
        </DashboardLayout>
    );
}
