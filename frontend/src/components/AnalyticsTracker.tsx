'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function AnalyticsTracker() {
    const pathname = usePathname();

    useEffect(() => {
        // Generate or get a session ID
        let sessionId = sessionStorage.getItem('site_session_id');
        if (!sessionId) {
            sessionId = Math.random().toString(36).substring(2, 15);
            sessionStorage.setItem('site_session_id', sessionId);
        }

        const trackVisit = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                await fetch(`${baseUrl}/api/analytics/track`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId,
                        path: pathname,
                        timeSpent: 5 // Ping every 5 seconds to increment
                    }),
                    // keepalive to ensure it fires even on unmount/navigate
                    keepalive: true
                });
            } catch (err) {
                // Silently ignore tracking errors
            }
        };

        trackVisit(); // initial hit

        const interval = setInterval(trackVisit, 5000); // Heartbeat every 5s

        return () => clearInterval(interval);
    }, [pathname]);

    return null;
}
