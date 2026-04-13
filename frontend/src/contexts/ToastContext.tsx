'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 5000); // Auto dismiss after 5s
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-4 px-4 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border relative overflow-hidden group min-w-[340px] max-w-md animate-in slide-in-from-right-full fade-in duration-500 ease-out ${toast.type === 'success' ? 'bg-emerald-50/90 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100' :
                                toast.type === 'error' ? 'bg-rose-50/90 dark:bg-rose-950/20 border-rose-100 dark:border-rose-800 text-rose-900 dark:text-rose-100' :
                                    toast.type === 'warning' ? 'bg-amber-50/90 dark:bg-amber-950/20 border-amber-100 dark:border-amber-800 text-amber-900 dark:text-amber-100' :
                                        'bg-indigo-50/90 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100'
                            }`}
                    >
                        {/* Progress Bar Animation */}
                        <div className={`absolute bottom-0 left-0 h-1 transition-all duration-[5000ms] ease-linear w-full ${toast.type === 'success' ? 'bg-emerald-500/30' :
                                toast.type === 'error' ? 'bg-rose-500/30' :
                                    toast.type === 'warning' ? 'bg-amber-500/30' :
                                        'bg-indigo-500/30'
                            }`} style={{ width: '0%', animation: 'toast-progress 5s linear forwards' }} />

                        <div className={`flex-shrink-0 p-2.5 rounded-xl ${toast.type === 'success' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                                toast.type === 'error' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' :
                                    toast.type === 'warning' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' :
                                        'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                            }`}>
                            {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
                            {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
                            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                            {toast.type === 'info' && <Info className="w-5 h-5" />}
                        </div>

                        <div className="flex-1">
                            <h4 className="text-sm font-bold tracking-tight">
                                {toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}
                            </h4>
                            <p className="text-sm opacity-80 leading-snug mt-0.5">{toast.message}</p>
                        </div>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-current/50 hover:text-current transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
