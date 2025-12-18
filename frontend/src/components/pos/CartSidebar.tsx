
import React from 'react';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
}

interface CartSidebarProps {
    cartItems: CartItem[];
    onUpdateQuantity: (productId: string, delta: number) => void;
    onRemoveItem: (productId: string) => void;
    onCheckout: () => void;
    onClearCart: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ cartItems, onUpdateQuantity, onRemoveItem, onCheckout, onClearCart }) => {

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = 0; // Configurable later
    const total = subtotal + tax;

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-xl">
            {/* Header */}
            <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-indigo-600" />
                    <h2 className="font-bold text-gray-900 dark:text-white">Current Sale</h2>
                </div>
                <button onClick={onClearCart} className="text-xs text-red-500 hover:text-red-700 font-medium">
                    Clear All
                </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cartItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                        <ShoppingCart className="w-12 h-12 opacity-20" />
                        <p>Cart is empty</p>
                    </div>
                ) : (
                    cartItems.map(item => (
                        <div key={item.productId} className="flex gap-3 bg-gray-50 dark:bg-gray-800/30 p-2 rounded-lg group">
                            {/* Tiny Image */}
                            <div className="h-12 w-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                {item.imageUrl && <img src={item.imageUrl} className="w-full h-full object-cover" />}
                            </div>

                            {/* Details */}
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-1">{item.name}</h4>
                                    <span className="text-sm font-bold">{(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                                <div className="text-xs text-gray-500">@{item.price} each</div>

                                <div className="flex justify-between items-center mt-2">
                                    <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 p-0.5">
                                        <button
                                            onClick={() => onUpdateQuantity(item.productId, -1)}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => onUpdateQuantity(item.productId, 1)}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => onRemoveItem(item.productId)}
                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer / Totals */}
            <div className="p-4 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>KES {subtotal.toLocaleString()}</span>
                </div>
                {/* <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax</span>
                    <span>KES {tax.toLocaleString()}</span>
                </div> */}
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>Total</span>
                    <span>KES {total.toLocaleString()}</span>
                </div>

                <Button
                    className="w-full py-3 text-lg shadow-lg shadow-indigo-200 dark:shadow-none"
                    onClick={onCheckout}
                    disabled={cartItems.length === 0}
                >
                    Charge KES {total.toLocaleString()}
                </Button>
            </div>
        </div>
    );
};

export default CartSidebar;
