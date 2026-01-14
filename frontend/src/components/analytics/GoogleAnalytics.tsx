'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import api from '@/lib/api';

export function GoogleAnalytics() {
    const [gtagId, setGtagId] = useState<string | null>(null);

    useEffect(() => {
        api.get('/settings/public')
            .then(res => {
                if (res.data.googleAnalyticsId) {
                    setGtagId(res.data.googleAnalyticsId);
                }
            })
            .catch(err => {
                // Silent failure is okay for analytics
                // console.error('Failed to load analytics ID', err);
            });
    }, []);

    if (!gtagId) return null;

    return (
        <>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`}
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${gtagId}');
        `}
            </Script>
        </>
    );
}
