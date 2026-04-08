import type { Post, CreatePostInput, UpdatePostInput } from '../entities/Post';
import type { FunnelStage } from '../value-objects/FunnelStage';

export interface IPostRepository {
  findById(id: string): Promise<Post | null>;
  findBySlug(slug: string): Promise<Post | null>;
  findAll(options?: { limit?: number; offset?: number }): Promise<Post[]>;
  findByFunnelStage(stage: FunnelStage): Promise<Post[]>;
  findByTopicCluster(cluster: string): Promise<Post[]>;
  findByKeywords(keywords: string[]): Promise<Post[]>;
  search(query: string, options?: { limit?: number }): Promise<Post[]>;
  create(input: CreatePostInput): Promise<Post>;
  update(id: string, input: UpdatePostInput): Promise<Post>;
}
