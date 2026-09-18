'use client';
import { useEffect } from 'react';

export function DynamicFavicon() {
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || window.location.origin.replace(/:\d+$/, ':5000');
                const response = await fetch(`${baseUrl}/api/settings/public`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.faviconUrl) {
                        const favUrl = data.faviconUrl.startsWith('http') ? data.faviconUrl : `${baseUrl}${data.faviconUrl}`;
                        // Update standard favicon
                        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
                        if (!link) {
                            link = document.createElement('link');
                            link.rel = 'icon';
                            document.head.appendChild(link);
                        }
                        link.href = favUrl;
                        
                        // Update apple touch icon
                        let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
                        if (!appleLink) {
                            appleLink = document.createElement('link');
                            appleLink.rel = 'apple-touch-icon';
                            document.head.appendChild(appleLink);
                        }
                        appleLink.href = favUrl;
                    }
                }
            } catch (error) {
                console.error('Failed to fetch favicon', error);
            }
        };
        fetchSettings();
    }, []);

    return null;
}
