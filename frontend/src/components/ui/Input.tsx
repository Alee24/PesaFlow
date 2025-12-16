import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    className = '',
    ...props
}) => {
    return (
        <div className="w-full space-y-1">
            {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
            <div className="relative">
                <input
                    className={`
            w-full px-4 py-2.5 rounded-xl border bg-white/50 backdrop-blur-sm
            focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'}
            ${className}
          `}
                    {...props}
                />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
};
