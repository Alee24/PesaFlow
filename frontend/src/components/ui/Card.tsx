import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    title?: string;
    description?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, description, ...props }) => {
    return (
        <div
            className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 ${className}`}
            {...props}
        >
            {(title || description) && (
                <div className="mb-6 space-y-1">
                    {title && <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>}
                    {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
                </div>
            )}
            {children}
        </div>
    );
};
