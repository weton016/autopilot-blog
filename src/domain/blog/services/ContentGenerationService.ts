import type { Post, CreatePostInput } from '../entities/Post';
import type { FunnelStage } from '../value-objects/FunnelStage';

export interface GeneratedPostData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  primaryKeyword: string;
  topicCluster: string;
  readTimeMinutes: number;
  funnelStage: FunnelStage;
}

export interface IContentGenerator {
  generatePost(prompt: string): Promise<GeneratedPostData>;
}

export class ContentGenerationService {
  constructor(private readonly generator: IContentGenerator) {}

  async generate(prompt: string): Promise<GeneratedPostData> {
    return this.generator.generatePost(prompt);
  }

  buildCreatePostInput(
    data: GeneratedPostData,
    relatedPostIds: string[] = []
  ): CreatePostInput {
    return {
      slug: data.slug,
      title: data.title,
      excerpt: data.excerpt,
      content: data.content,
      coverImageUrl: null,
      funnelStage: data.funnelStage,
      topicCluster: data.topicCluster,
      relatedPostIds,
      keywords: data.keywords,
      primaryKeyword: data.primaryKeyword,
      keywordVolume: null,
      keywordDifficulty: null,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      ogImage: null,
      readTimeMinutes: data.readTimeMinutes,
      publishedAt: new Date(),
    };
  }
}

export function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(wordCount / wordsPerMinute));
}
