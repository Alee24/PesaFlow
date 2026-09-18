import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/pos', '/settings', '/api', '/admin'],
    },
    sitemap: 'https://mpesaconnect.co.ke/sitemap.xml',
  };
}
