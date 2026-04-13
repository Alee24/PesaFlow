'use client';

import React from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
    message?: string;
    subMessage?: string;
}

export function LoadingOverlay({ message = "Verifying System...", subMessage = "Establishing secure connection to license server" }: LoadingOverlayProps) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
            <div className="relative flex flex-col items-center">
                {/* Outer pulsing decoration */}
                <div className="absolute -inset-8 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 animate-[ping_3s_linear_infinite]" />

                {/* Main Spinner Container */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                    {/* Rotating gradient ring */}
                    <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-indigo-600 border-r-violet-600 animate-[spin_1s_linear_infinite]" />

                    {/* Rotating dashed ring */}
                    <div className="absolute inset-2 rounded-full border-[2px] border-dashed border-gray-200 dark:border-gray-700 animate-[spin_10s_linear_infinite]" />

                    {/* Inner glowing core with icon */}
                    <div className="relative w-20 h-20 rounded-full bg-white dark:bg-gray-800 shadow-2xl flex items-center justify-center border border-gray-100 dark:border-gray-700">
                        <ShieldCheck className="w-10 h-10 text-indigo-600 animate-[pulse_2s_ease-in-out_infinite]" />
                    </div>
                </div>

                {/* Text Content */}
                <div className="mt-10 text-center space-y-2 max-w-xs">
                    <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                        {message}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-tight animate-pulse">
                        {subMessage}
                    </p>
                </div>

                {/* Progress bits */}
                <div className="mt-8 flex gap-1.5 text-indigo-600/30 dark:text-indigo-400/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-[bounce_1s_infinite_100ms]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-[bounce_1s_infinite_200ms]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-[bounce_1s_infinite_300ms]" />
                </div>
            </div>
        </div>
    );
}
