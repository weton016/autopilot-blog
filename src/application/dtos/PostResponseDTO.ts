import type { FunnelStage } from '../../domain/blog/value-objects/FunnelStage';

export interface PostResponseDTO {
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
  publishedAt: string;
}
