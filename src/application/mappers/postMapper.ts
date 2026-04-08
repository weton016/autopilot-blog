import type { Post } from '../../domain/blog/entities/Post';
import type { PostResponseDTO } from '../dtos/PostResponseDTO';

export function postToDTO(post: Post): PostResponseDTO {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    coverImageUrl: post.coverImageUrl,
    funnelStage: post.funnelStage,
    topicCluster: post.topicCluster,
    relatedPostIds: post.relatedPostIds,
    keywords: post.keywords,
    primaryKeyword: post.primaryKeyword,
    keywordVolume: post.keywordVolume,
    keywordDifficulty: post.keywordDifficulty,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    ogImage: post.ogImage,
    readTimeMinutes: post.readTimeMinutes,
    publishedAt: post.publishedAt.toISOString(),
  };
}
