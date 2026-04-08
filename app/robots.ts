import type { MetadataRoute } from 'next';

const WEBSITE_URL = process.env.WEBSITE_URL ?? '';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: `${WEBSITE_URL}/sitemap.xml`,
  };
}
