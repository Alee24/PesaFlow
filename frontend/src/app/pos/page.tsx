'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProductGrid from '@/components/pos/ProductGrid';
import CartSidebar from '@/components/pos/CartSidebar';
import PaymentModal from '@/components/pos/PaymentModal';
import { ReceiptModal } from '@/components/pos/ReceiptModal';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { ShoppingCart, X, LogOut, ArrowLeft } from 'lucide-react';

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
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isKiosk, setIsKiosk] = useState(false);
    const [posUser, setPosUser] = useState<any>(null);

    useEffect(() => {
        const pToken = localStorage.getItem('posToken');
        if (pToken) {
            setIsKiosk(true);
            const pu = localStorage.getItem('posUser');
            if (pu) setPosUser(JSON.parse(pu));
        }
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

    const addToCart = (product: Product) => {
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
        setIsCartOpen(false);
    };

    const handleCheckoutSuccess = (sale: any) => {
        setIsPaymentOpen(false);
        setCartItems([]);
        setLastSale(sale);
        fetchData();
    };

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalAmount = discountData
        ? Math.max(0, subtotal - (discountData.discountType === 'PERCENTAGE' ? (subtotal * discountData.discountValue / 100) : discountData.discountValue))
        : subtotal;

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const handleExitPos = () => {
        if (isKiosk) {
            localStorage.removeItem('posToken');
            localStorage.removeItem('posUser');
            window.location.href = '/pos/login';
        } else {
            window.location.href = '/dashboard';
        }
    };

    const content = (
        <div className="flex flex-col h-screen bg-gray-50/50 dark:bg-gray-900/50 relative">
            <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">Point of Sale</h1>
                    {isKiosk && posUser && (
                        <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-sm font-medium border border-indigo-100 dark:border-indigo-800">
                            Cashier: {posUser.name}
                        </span>
                    )}
                </div>
                <button onClick={handleExitPos} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors text-gray-600 dark:text-gray-300">
                    {isKiosk ? <LogOut className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                    {isKiosk ? 'Lock Terminal' : 'Back to Dashboard'}
                </button>
            </header>
            
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
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

                {/* Desktop Sidebar */}
                <div className="hidden md:block w-96 h-full z-10 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
                    <CartSidebar
                        cartItems={cartItems}
                        onUpdateQuantity={updateQuantity}
                        onRemoveItem={removeItem}
                        onClearCart={() => setCartItems([])}
                        onCheckout={handleCheckout}
                    />
                </div>

                {/* Mobile Cart Button */}
                {!isCartOpen && (
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="md:hidden fixed bottom-6 right-6 z-50 bg-indigo-600 text-white rounded-full p-4 shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                        <ShoppingCart className="w-6 h-6" />
                        {totalItems > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                                {totalItems}
                            </span>
                        )}
                    </button>
                )}

                {/* Mobile Cart Modal */}
                {isCartOpen && (
                    <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
                        <div className="absolute inset-x-0 bottom-0 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                                <h2 className="text-lg font-bold">Current Order ({totalItems})</h2>
                                <button
                                    onClick={() => setIsCartOpen(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Cart Content */}
                            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
                                <CartSidebar
                                    cartItems={cartItems}
                                    onUpdateQuantity={updateQuantity}
                                    onRemoveItem={removeItem}
                                    onClearCart={() => {
                                        setCartItems([]);
                                        setIsCartOpen(false);
                                    }}
                                    onCheckout={handleCheckout}
                                />
                            </div>
                        </div>
                    </div>
                )}
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
        </div>
    );

    return isKiosk ? content : <DashboardLayout>{content}</DashboardLayout>;
}
