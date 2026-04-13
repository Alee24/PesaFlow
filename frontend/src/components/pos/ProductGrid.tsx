
import React, { useState } from 'react';
import { Search, ShoppingCart, Package, Plus, Utensils, Coffee, IceCream, ChefHat } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { getImageUrl, cn } from '@/lib/utils';

interface Product {
    id: string;
    name: string;
    price: string | number;
    imageUrl?: string;
    stockQuantity: number;
    categoryId?: string;
    sku?: string;
    barcode?: string;
}

interface Category {
    id: string;
    name: string;
    _count?: { products: number };
}

interface ProductGridProps {
    products: Product[];
    categories: Category[];
    onAddToCart: (product: Product) => void;
}

// Map common category names to icons
const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('breakfast')) return <Coffee className="w-4 h-4 sm:w-5 sm:h-5" />;
    if (lower.includes('lunch') || lower.includes('dinner')) return <Utensils className="w-4 h-4 sm:w-5 sm:h-5" />;
    if (lower.includes('dessert')) return <IceCream className="w-4 h-4 sm:w-5 sm:h-5" />;
    return <ChefHat className="w-4 h-4 sm:w-5 sm:h-5" />;
};

const ProductGrid: React.FC<ProductGridProps> = ({ products, categories, onAddToCart }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const filteredProducts = products.filter(p => {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
            p.name.toLowerCase().includes(search) ||
            p.sku?.toLowerCase().includes(search) ||
            p.barcode?.includes(search);

        const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Barcode Scanner Logic
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchTerm) {
            const exactMatch = products.find(p => p.barcode === searchTerm || p.sku === searchTerm);
            if (exactMatch) {
                onAddToCart(exactMatch);
                setSearchTerm('');
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/50 dark:bg-black/20">
            {/* Top Bar: Search & Categories */}
            <div className="p-3 sm:p-4 md:p-6 pb-2 space-y-3 sm:space-y-4 md:space-y-6">
                {/* Search */}
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <Input
                        className="pl-9 sm:pl-12 h-10 sm:h-12 rounded-full border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500/20 text-sm sm:text-base"
                        placeholder="Scan Barcode or Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                </div>

                {/* Categories - Horizontal Scroll */}
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-3 sm:pb-4 no-scrollbar">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={cn(
                            "flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl border transition-all duration-200 min-w-max",
                            selectedCategory === 'all'
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                : "bg-white border-gray-100 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        )}
                    >
                        <div className={cn(
                            "p-1.5 sm:p-2 rounded-lg",
                            selectedCategory === 'all' ? "bg-white/20" : "bg-gray-100 text-gray-400"
                        )}>
                            <ChefHat className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-xs sm:text-sm">All Menu</div>
                            <div className={cn("text-[10px] sm:text-xs opacity-70", selectedCategory === 'all' ? "text-indigo-100" : "text-gray-400")}>
                                {products.length} Items
                            </div>
                        </div>
                    </button>

                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={cn(
                                "flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl border transition-all duration-200 min-w-max",
                                selectedCategory === cat.id
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                    : "bg-white border-gray-100 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                            )}
                        >
                            <div className={cn(
                                "p-1.5 sm:p-2 rounded-lg",
                                selectedCategory === cat.id ? "bg-white/20" : "bg-gray-100 text-gray-400"
                            )}>
                                {getCategoryIcon(cat.name)}
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-xs sm:text-sm w-full truncate max-w-[120px] sm:max-w-none">{cat.name}</div>
                                <div className={cn("text-[10px] sm:text-xs opacity-70", selectedCategory === cat.id ? "text-indigo-100" : "text-gray-400")}>
                                    {cat._count?.products || 0} Items
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 pb-20">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 md:gap-6 content-start">
                    {filteredProducts.map(product => {
                        const isOutOfStock = product.stockQuantity <= 0;
                        return (
                            <button
                                key={product.id}
                                onClick={() => !isOutOfStock && onAddToCart(product)}
                                disabled={isOutOfStock}
                                className={cn(
                                    "group relative flex flex-col overflow-hidden transition-all duration-300 border-0 shadow-sm bg-white dark:bg-gray-800 rounded-2xl sm:rounded-[20px] ring-1 ring-gray-100 dark:ring-gray-800 text-left",
                                    !isOutOfStock && "hover:shadow-xl hover:-translate-y-1 active:scale-95 cursor-pointer",
                                    isOutOfStock ? "opacity-75 grayscale-[0.5] cursor-not-allowed" : ""
                                )}
                            >
                                {/* Image Area */}
                                <div className="relative aspect-square sm:aspect-[4/3] overflow-hidden bg-gray-50 dark:bg-gray-900 m-1.5 sm:m-2 rounded-xl">
                                    {product.imageUrl ? (
                                        <img
                                            src={getImageUrl(product.imageUrl)}
                                            alt={product.name}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            loading="lazy"
                                            onError={(e) => {
                                                const parent = (e.target as HTMLElement).parentElement;
                                                if (parent) {
                                                    parent.innerHTML = `
                                                        <div class="flex h-full flex-col items-center justify-center text-gray-300 dark:text-gray-700">
                                                            <svg class="h-8 w-8 sm:h-10 sm:w-10 opacity-20" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22v-10"/></svg>
                                                        </div>
                                                    `;
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div className="flex h-full flex-col items-center justify-center text-gray-300 dark:text-gray-700">
                                            <Package className="h-8 w-8 sm:h-10 sm:w-10 opacity-20" />
                                        </div>
                                    )}

                                    {/* Stock Badge */}
                                    {isOutOfStock && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                                            <span className="bg-red-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg">
                                                Sold Out
                                            </span>
                                        </div>
                                    )}

                                    {/* Add Icon Overlay on Hover */}
                                    {!isOutOfStock && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-indigo-600/0 group-hover:bg-indigo-600/20 transition-all duration-300 opacity-0 group-hover:opacity-100">
                                            <div className="bg-white rounded-full p-2 sm:p-3 shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300">
                                                <Plus className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-600" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Info Area */}
                                <div className="flex flex-1 flex-col p-2 sm:p-3">
                                    <h3 className="line-clamp-2 font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm mb-1 min-h-[2.5rem] sm:min-h-0" title={product.name}>
                                        {product.name}
                                    </h3>

                                    <div className="mt-auto flex items-center justify-between">
                                        <div className="text-sm sm:text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                                            <span className="text-[10px] sm:text-xs font-medium text-gray-400 mr-0.5">KES</span>
                                            {Number(product.price).toLocaleString()}
                                        </div>

                                        {!isOutOfStock && (
                                            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                                                <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600 group-hover:text-white transition-colors" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Stock Indicator */}
                                    {!isOutOfStock && product.stockQuantity <= 5 && (
                                        <div className="mt-1.5 text-[10px] sm:text-xs text-orange-500 font-medium">
                                            Only {product.stockQuantity} left
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                        <Search className="h-10 w-10 sm:h-12 sm:w-12 opacity-20 mb-4" />
                        <p className="text-base sm:text-lg font-medium">No results found</p>
                        <p className="text-xs sm:text-sm opacity-60">Try selecting a different category</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductGrid;
