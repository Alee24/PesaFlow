
import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    variant?: 'danger' | 'warning' | 'info' | 'success';
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    variant = 'warning',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    loading = false
}) => {

    const getIcon = () => {
        switch (variant) {
            case 'danger': return <AlertCircle className="w-12 h-12 text-red-500 mb-4" />;
            case 'warning': return <AlertCircle className="w-12 h-12 text-orange-500 mb-4" />;
            case 'success': return <CheckCircle className="w-12 h-12 text-green-500 mb-4" />;
            default: return <HelpCircle className="w-12 h-12 text-blue-500 mb-4" />;
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col items-center text-center">
                {getIcon()}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
                    {description}
                </p>
                <div className="flex gap-3 w-full justify-center">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={loading}
                        className="w-full sm:w-auto"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`w-full sm:w-auto bg-gray-900 text-white hover:bg-gray-800 ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : ''
                            }`}
                    >
                        {loading ? 'Processing...' : confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
