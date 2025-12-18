
import React, { useState } from 'react';
import { Search, Tag } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface Product {
    id: string;
    name: string;
    price: string;
    imageUrl?: string;
    stockQuantity: number;
    categoryId?: string;
}

interface ProductGridProps {
    products: Product[];
    onAddToCart: (product: Product) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, onAddToCart }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Extract unique categories (if we had category objects, but we assume product has categoryId)
    // For now, simpler filter by search.

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.categoryId && p.categoryId.includes(searchTerm))
    );

    return (
        <div className="flex flex-col h-full">
            {/* Search Bar */}
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                        className="pl-10"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto pb-20 content-start">
                {filteredProducts.map(product => (
                    <Card
                        key={product.id}
                        className="cursor-pointer hover:shadow-xl transition-all duration-200 p-0 overflow-hidden group relative border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col hover:-translate-y-1"
                        onClick={() => onAddToCart(product)}
                    >
                        {/* Image Area - Square Aspect Ratio */}
                        <div
                            className="w-full bg-gray-100 dark:bg-gray-900 relative overflow-hidden flex items-center justify-center"
                            style={{ aspectRatio: '1/1' }}
                        >
                            {product.imageUrl ? (
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-300 bg-gray-50 dark:bg-gray-800/50">
                                    <Tag className="w-12 h-12 mb-2 opacity-20" />
                                    <span className="text-xs font-medium opacity-40">No Image</span>
                                </div>
                            )}

                            {/* Stock Badge - Floating */}
                            <div className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-md shadow-sm ${product.stockQuantity > 0
                                ? 'bg-white/90 text-gray-800 dark:bg-black/60 dark:text-white'
                                : 'bg-red-500/90 text-white'
                                }`}>
                                {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of Stock'}
                            </div>
                        </div>

                        {/* Info Area */}
                        <div className="p-3 flex flex-col flex-1">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm line-clamp-2 leading-tight mb-auto" title={product.name}>
                                {product.name}
                            </h3>
                            <div className="mt-2 pt-2 border-t border-gray-50 dark:border-gray-700/50 flex justify-between items-end">
                                <span className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                                    <span className="text-xs opacity-60 mr-0.5">KES</span>
                                    {Number(product.price).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Interactive Overlay Effect */}
                        <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </Card>
                ))}
            </div>

            {filteredProducts.length === 0 && (
                <div className="flex items-center justify-center h-64 text-gray-500">
                    No products found.
                </div>
            )}
        </div>
    );
};

export default ProductGrid;
