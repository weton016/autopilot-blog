import type { MetadataRoute } from 'next';
import { SupabasePostRepository } from '@/src/infrastructure/repositories/SupabasePostRepository';

const WEBSITE_URL = process.env.WEBSITE_URL ?? '';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const repo = new SupabasePostRepository();
  const posts = await repo.findAll({ limit: 1000 });

  const postUrls: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${WEBSITE_URL}/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: `${WEBSITE_URL}`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    ...postUrls,
  ];
}
