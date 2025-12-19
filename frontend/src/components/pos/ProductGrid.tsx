
import React, { useState } from 'react';
import { Search, ShoppingCart, Package, Plus, Utensils, Coffee, IceCream, ChefHat } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { getImageUrl, cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface Product {
    id: string;
    name: string;
    price: string;
    imageUrl?: string;
    stockQuantity: number;
    categoryId?: string;
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

// Map common category names to icons for a nice touch
const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('breakfast')) return <Coffee className="w-5 h-5" />;
    if (lower.includes('lunch') || lower.includes('dinner')) return <Utensils className="w-5 h-5" />;
    if (lower.includes('dessert')) return <IceCream className="w-5 h-5" />;
    return <ChefHat className="w-5 h-5" />;
};

const ProductGrid: React.FC<ProductGridProps> = ({ products, categories, onAddToCart }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="flex flex-col h-full bg-gray-50/50 dark:bg-black/20">
            {/* Top Bar: Search & Categories */}
            <div className="p-4 md:p-6 pb-2 space-y-6">
                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                        className="pl-12 h-12 rounded-full border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500/20 text-base"
                        placeholder="Search your menu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Categories - Horizontal Scroll */}
                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={cn(
                            "flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-200 min-w-max",
                            selectedCategory === 'all'
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                : "bg-white border-gray-100 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        )}
                    >
                        <div className={cn(
                            "p-2 rounded-lg",
                            selectedCategory === 'all' ? "bg-white/20" : "bg-gray-100 text-gray-400"
                        )}>
                            <ChefHat className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-sm">All Menu</div>
                            <div className={cn("text-xs opacity-70", selectedCategory === 'all' ? "text-indigo-100" : "text-gray-400")}>
                                {products.length} Items
                            </div>
                        </div>
                    </button>

                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={cn(
                                "flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-200 min-w-max",
                                selectedCategory === cat.id
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                    : "bg-white border-gray-100 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                            )}
                        >
                            <div className={cn(
                                "p-2 rounded-lg",
                                selectedCategory === cat.id ? "bg-white/20" : "bg-gray-100 text-gray-400"
                            )}>
                                {getCategoryIcon(cat.name)}
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-sm w-full truncate">{cat.name}</div>
                                <div className={cn("text-xs opacity-70", selectedCategory === cat.id ? "text-indigo-100" : "text-gray-400")}>
                                    {cat._count?.products || 0} Items
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-20">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6 content-start">
                    {filteredProducts.map(product => {
                        const isOutOfStock = product.stockQuantity <= 0;
                        return (
                            <Card
                                key={product.id}
                                className={cn(
                                    "group relative flex flex-col overflow-hidden transition-all duration-300 border-0 shadow-sm bg-white dark:bg-gray-800 rounded-[20px] ring-1 ring-gray-100 dark:ring-gray-800 hover:shadow-xl hover:-translate-y-1",
                                    isOutOfStock ? "opacity-75 grayscale-[0.5]" : ""
                                )}
                            >
                                {/* Image Area */}
                                <div className="relative aspect-[4/3] overflow-hidden bg-gray-50 dark:bg-gray-900 mx-2 mt-2 rounded-xl">
                                    {product.imageUrl ? (
                                        <img
                                            src={getImageUrl(product.imageUrl)}
                                            alt={product.name}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="flex h-full flex-col items-center justify-center text-gray-300 dark:text-gray-700">
                                            <Package className="h-10 w-10 opacity-20" />
                                        </div>
                                    )}

                                    {/* Stock Badge */}
                                    {isOutOfStock && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                                Sold Out
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Info Area */}
                                <div className="flex flex-1 flex-col p-3">
                                    <h3 className="line-clamp-1 font-bold text-gray-900 dark:text-gray-100 text-sm mb-1" title={product.name}>
                                        {product.name}
                                    </h3>

                                    <div className="mt-auto flex items-center justify-between">
                                        <div className="text-base font-extrabold text-gray-900 dark:text-white">
                                            <span className="text-xs font-medium text-gray-400 mr-0.5">$</span>
                                            {Number(product.price).toLocaleString()}
                                        </div>

                                        <Button
                                            disabled={isOutOfStock}
                                            onClick={() => onAddToCart(product)}
                                            size="sm"
                                            className={cn(
                                                "h-8 w-8 rounded-full p-0 shadow-lg shadow-indigo-500/20 transition-transform active:scale-95",
                                                isOutOfStock ? "bg-gray-100 text-gray-400" : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                            )}
                                        >
                                            <Plus className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                        <Search className="h-12 w-12 opacity-20 mb-4" />
                        <p className="text-lg font-medium">No results found</p>
                        <p className="text-sm opacity-60">Try selecting a different category</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductGrid;
