
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string; // For customized content container
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className }) => {
    const [isVisible, setIsVisible] = useState(false);

    // Handle animation timing
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        } else {
            const timer = setTimeout(() => {
                setIsVisible(false);
                document.body.style.overflow = 'unset';
            }, 300); // Match transition duration
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    // Use portal to render at root level ensures z-index works properly
    return createPortal(
        <div
            className={clsx(
                "fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6",
                "transition-all duration-300 ease-in-out",
                isOpen ? "visible opacity-100" : "invisible opacity-0"
            )}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Content */}
            <div
                className={clsx(
                    "relative w-full max-w-lg transform rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl transition-all duration-300",
                    "border border-gray-100 dark:border-gray-700",
                    isOpen ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0",
                    className
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    {title && <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>}
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="mt-2">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};
