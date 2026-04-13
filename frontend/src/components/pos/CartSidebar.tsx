
import React from 'react';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getImageUrl } from '@/lib/utils';

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
    onCheckout: (data?: any) => void;
    onClearCart: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ cartItems, onUpdateQuantity, onRemoveItem, onCheckout, onClearCart }) => {

    const [discountType, setDiscountType] = React.useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
    const [discountValue, setDiscountValue] = React.useState<number>(0);

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    let discountAmount = 0;
    if (discountValue > 0) {
        if (discountType === 'PERCENTAGE') {
            discountAmount = (subtotal * discountValue) / 100;
        } else {
            discountAmount = discountValue;
        }
    }

    const total = Math.max(0, subtotal - discountAmount);

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
                                {item.imageUrl ? (
                                    <img
                                        src={getImageUrl(item.imageUrl)}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).parentElement!.classList.add('flex', 'items-center', 'justify-center');
                                            (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <ShoppingCart className="w-6 h-6 opacity-50" />
                                    </div>
                                )}
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

                {/* Discount Section */}
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Discount</span>
                        <div className="flex bg-gray-100 dark:bg-gray-900 rounded p-0.5">
                            <button
                                onClick={() => setDiscountType('PERCENTAGE')}
                                className={`px-2 py-0.5 text-xs rounded ${discountType === 'PERCENTAGE' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                            >%</button>
                            <button
                                onClick={() => setDiscountType('FIXED')}
                                className={`px-2 py-0.5 text-xs rounded ${discountType === 'FIXED' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                            >$</button>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            min="0"
                            value={discountValue}
                            onChange={(e) => setDiscountValue(Number(e.target.value))}
                            className="w-full text-sm p-1 border rounded bg-transparent text-right"
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>KES {subtotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                        <span>Discount ({discountType === 'PERCENTAGE' ? `${discountValue}%` : 'Fixed'})</span>
                        <span>- KES {discountAmount.toLocaleString()}</span>
                    </div>
                )}

                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>Total</span>
                    <span>KES {total.toLocaleString()}</span>
                </div>

                <Button
                    className="w-full py-3 text-lg shadow-lg shadow-indigo-200 dark:shadow-none"
                    onClick={() => onCheckout({ discountType, discountValue, totalAmount: total })}
                    disabled={cartItems.length === 0}
                >
                    Charge KES {total.toLocaleString()}
                </Button>
            </div>
        </div>
    );
};

export default CartSidebar;
