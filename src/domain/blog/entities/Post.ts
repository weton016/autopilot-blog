import type { FunnelStage } from '../value-objects/FunnelStage';

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  funnelStage: FunnelStage;
  topicCluster: string | null;
  relatedPostIds: string[];
  keywords: string[];
  primaryKeyword: string | null;
  keywordVolume: number | null;
  keywordDifficulty: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  readTimeMinutes: number | null;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type CreatePostInput = Omit<Post, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdatePostInput = Partial<Omit<Post, 'id' | 'createdAt'>>;
