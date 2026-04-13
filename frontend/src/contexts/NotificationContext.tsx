'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X, TrendingUp, Lock, CreditCard, Users } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'upgrade' | 'limit' | 'feature';

interface NotificationDetails {
    title: string;
    message: string;
    details?: string[];
    action?: {
        label: string;
        onClick: () => void;
    };
    duration?: number;
}

interface Notification extends NotificationDetails {
    id: string;
    type: NotificationType;
}

interface NotificationContextType {
    showNotification: (type: NotificationType, details: NotificationDetails) => void;
    showSuccess: (title: string, message: string, details?: string[]) => void;
    showError: (title: string, message: string, details?: string[]) => void;
    showWarning: (title: string, message: string, details?: string[]) => void;
    showInfo: (title: string, message: string, details?: string[]) => void;
    showUpgradePrompt: (currentPlan: string, requiredPlan: string, feature: string) => void;
    showLimitReached: (limit: number, used: number, plan: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return context;
};

const getNotificationConfig = (type: NotificationType) => {
    switch (type) {
        case 'success':
            return {
                icon: CheckCircle,
                bgGradient: 'from-green-500 to-emerald-600',
                borderColor: 'border-green-500',
                iconColor: 'text-green-500',
                bgColor: 'bg-green-50 dark:bg-green-900/20'
            };
        case 'error':
            return {
                icon: XCircle,
                bgGradient: 'from-red-500 to-rose-600',
                borderColor: 'border-red-500',
                iconColor: 'text-red-500',
                bgColor: 'bg-red-50 dark:bg-red-900/20'
            };
        case 'warning':
            return {
                icon: AlertCircle,
                bgGradient: 'from-yellow-500 to-orange-600',
                borderColor: 'border-yellow-500',
                iconColor: 'text-yellow-500',
                bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
            };
        case 'info':
            return {
                icon: Info,
                bgGradient: 'from-blue-500 to-cyan-600',
                borderColor: 'border-blue-500',
                iconColor: 'text-blue-500',
                bgColor: 'bg-blue-50 dark:bg-blue-900/20'
            };
        case 'upgrade':
            return {
                icon: TrendingUp,
                bgGradient: 'from-purple-500 to-pink-600',
                borderColor: 'border-purple-500',
                iconColor: 'text-purple-500',
                bgColor: 'bg-purple-50 dark:bg-purple-900/20'
            };
        case 'limit':
            return {
                icon: AlertCircle,
                bgGradient: 'from-orange-500 to-red-600',
                borderColor: 'border-orange-500',
                iconColor: 'text-orange-500',
                bgColor: 'bg-orange-50 dark:bg-orange-900/20'
            };
        case 'feature':
            return {
                icon: Lock,
                bgGradient: 'from-indigo-500 to-purple-600',
                borderColor: 'border-indigo-500',
                iconColor: 'text-indigo-500',
                bgColor: 'bg-indigo-50 dark:bg-indigo-900/20'
            };
        default:
            return {
                icon: Info,
                bgGradient: 'from-gray-500 to-slate-600',
                borderColor: 'border-gray-500',
                iconColor: 'text-gray-500',
                bgColor: 'bg-gray-50 dark:bg-gray-900/20'
            };
    }
};

const NotificationItem: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
    const config = getNotificationConfig(notification.type);
    const Icon = config.icon;

    return (
        <div className="relative w-full max-w-md animate-slide-in-right">
            {/* Gradient border effect */}
            <div className={`absolute inset-0 bg-gradient-to-r ${config.bgGradient} rounded-2xl blur-sm opacity-75`}></div>

            <div className={`relative ${config.bgColor} border-2 ${config.borderColor} rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm`}>
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors z-10"
                >
                    <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>

                {/* Icon header with gradient */}
                <div className={`bg-gradient-to-r ${config.bgGradient} p-6 flex items-center justify-center`}>
                    <div className="bg-white/20 backdrop-blur-md rounded-full p-4">
                        <Icon className="w-12 h-12 text-white drop-shadow-lg" />
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {notification.title}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                        {notification.message}
                    </p>

                    {/* Details bubbles */}
                    {notification.details && notification.details.length > 0 && (
                        <div className="space-y-2 mb-4">
                            {notification.details.map((detail, index) => (
                                <div
                                    key={index}
                                    className="bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                                >
                                    <span className="inline-block w-2 h-2 rounded-full bg-current mr-2 opacity-50"></span>
                                    {detail}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Action button */}
                    {notification.action && (
                        <button
                            onClick={notification.action.onClick}
                            className={`w-full bg-gradient-to-r ${config.bgGradient} text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200`}
                        >
                            {notification.action.label}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const showNotification = useCallback((type: NotificationType, details: NotificationDetails) => {
        const id = Math.random().toString(36).substr(2, 9);
        const notification: Notification = { id, type, ...details };

        setNotifications(prev => [...prev, notification]);

        const duration = details.duration || 5000;
        if (duration > 0) {
            setTimeout(() => removeNotification(id), duration);
        }
    }, [removeNotification]);

    const showSuccess = useCallback((title: string, message: string, details?: string[]) => {
        showNotification('success', { title, message, details });
    }, [showNotification]);

    const showError = useCallback((title: string, message: string, details?: string[]) => {
        showNotification('error', { title, message, details, duration: 7000 });
    }, [showNotification]);

    const showWarning = useCallback((title: string, message: string, details?: string[]) => {
        showNotification('warning', { title, message, details, duration: 6000 });
    }, [showNotification]);

    const showInfo = useCallback((title: string, message: string, details?: string[]) => {
        showNotification('info', { title, message, details });
    }, [showNotification]);

    const showUpgradePrompt = useCallback((currentPlan: string, requiredPlan: string, feature: string) => {
        showNotification('upgrade', {
            title: '🚀 Upgrade Required',
            message: `Unlock ${feature} by upgrading to ${requiredPlan} plan`,
            details: [
                `Current Plan: ${currentPlan}`,
                `Required Plan: ${requiredPlan}`,
                `Feature: ${feature}`,
                'Upgrade now to access this feature'
            ],
            action: {
                label: `Upgrade to ${requiredPlan}`,
                onClick: () => window.location.href = '/subscription'
            },
            duration: 0 // Don't auto-dismiss
        });
    }, [showNotification]);

    const showLimitReached = useCallback((limit: number, used: number, plan: string) => {
        showNotification('limit', {
            title: '⚠️ Transaction Limit Reached',
            message: `You've reached your monthly transaction limit`,
            details: [
                `Transactions Used: ${used}/${limit}`,
                `Current Plan: ${plan}`,
                'Upgrade to PRO for unlimited transactions',
                'Limit resets on the 1st of next month'
            ],
            action: {
                label: 'Upgrade to PRO Plan',
                onClick: () => window.location.href = '/subscription'
            },
            duration: 0
        });
    }, [showNotification]);

    return (
        <NotificationContext.Provider
            value={{
                showNotification,
                showSuccess,
                showError,
                showWarning,
                showInfo,
                showUpgradePrompt,
                showLimitReached
            }}
        >
            {children}

            {/* Notification container */}
            <div className="fixed top-4 right-4 z-[9999] space-y-4 max-h-screen overflow-y-auto pointer-events-none">
                <div className="pointer-events-auto space-y-4">
                    {notifications.map(notification => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onClose={() => removeNotification(notification.id)}
                        />
                    ))}
                </div>
            </div>

            <style jsx global>{`
                @keyframes slide-in-right {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out;
                }
            `}</style>
        </NotificationContext.Provider>
    );
};
