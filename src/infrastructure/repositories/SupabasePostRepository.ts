import { createClient } from '@supabase/supabase-js';
import type { IPostRepository } from '../../domain/blog/repositories/IPostRepository';
import type { Post, CreatePostInput, UpdatePostInput } from '../../domain/blog/entities/Post';
import type { FunnelStage } from '../../domain/blog/value-objects/FunnelStage';

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

function mapRow(row: Record<string, unknown>): Post {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    excerpt: row.excerpt as string,
    content: row.content as string,
    coverImageUrl: (row.cover_image_url as string) ?? null,
    funnelStage: row.funnel_stage as FunnelStage,
    topicCluster: (row.topic_cluster as string) ?? null,
    relatedPostIds: (row.related_post_ids as string[]) ?? [],
    keywords: (row.keywords as string[]) ?? [],
    primaryKeyword: (row.primary_keyword as string) ?? null,
    keywordVolume: (row.keyword_volume as number) ?? null,
    keywordDifficulty: (row.keyword_difficulty as number) ?? null,
    metaTitle: (row.meta_title as string) ?? null,
    metaDescription: (row.meta_description as string) ?? null,
    ogImage: (row.og_image as string) ?? null,
    readTimeMinutes: (row.read_time_minutes as number) ?? null,
    publishedAt: new Date(row.published_at as string),
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export class SupabasePostRepository implements IPostRepository {
  private get db() {
    return getClient();
  }

  async findById(id: string): Promise<Post | null> {
    const { data } = await this.db.from('posts').select('*').eq('id', id).single();
    return data ? mapRow(data) : null;
  }

  async findBySlug(slug: string): Promise<Post | null> {
    const { data } = await this.db.from('posts').select('*').eq('slug', slug).single();
    return data ? mapRow(data) : null;
  }

  async findAll(options?: { limit?: number; offset?: number }): Promise<Post[]> {
    let query = this.db
      .from('posts')
      .select('*')
      .order('published_at', { ascending: false });

    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.range(options.offset, (options.offset ?? 0) + (options.limit ?? 10) - 1);

    const { data } = await query;
    return (data ?? []).map(mapRow);
  }

  async findByFunnelStage(stage: FunnelStage): Promise<Post[]> {
    const { data } = await this.db
      .from('posts')
      .select('*')
      .eq('funnel_stage', stage)
      .order('published_at', { ascending: false });
    return (data ?? []).map(mapRow);
  }

  async findByTopicCluster(cluster: string): Promise<Post[]> {
    const { data } = await this.db
      .from('posts')
      .select('*')
      .eq('topic_cluster', cluster)
      .order('published_at', { ascending: false });
    return (data ?? []).map(mapRow);
  }

  async findByKeywords(keywords: string[]): Promise<Post[]> {
    const { data } = await this.db
      .from('posts')
      .select('*')
      .overlaps('keywords', keywords)
      .order('published_at', { ascending: false });
    return (data ?? []).map(mapRow);
  }

  async search(query: string, options?: { limit?: number }): Promise<Post[]> {
    const term = `%${query}%`;
    const { data } = await this.db
      .from('posts')
      .select('*')
      .or(`title.ilike.${term},excerpt.ilike.${term}`)
      .order('published_at', { ascending: false })
      .limit(options?.limit ?? 20);
    return (data ?? []).map(mapRow);
  }

  async create(input: CreatePostInput): Promise<Post> {
    const { data, error } = await this.db
      .from('posts')
      .insert({
        slug: input.slug,
        title: input.title,
        excerpt: input.excerpt,
        content: input.content,
        cover_image_url: input.coverImageUrl,
        funnel_stage: input.funnelStage,
        topic_cluster: input.topicCluster,
        related_post_ids: input.relatedPostIds,
        keywords: input.keywords,
        primary_keyword: input.primaryKeyword,
        keyword_volume: input.keywordVolume,
        keyword_difficulty: input.keywordDifficulty,
        meta_title: input.metaTitle,
        meta_description: input.metaDescription,
        og_image: input.ogImage,
        read_time_minutes: input.readTimeMinutes,
        published_at: input.publishedAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create post: ${error.message}`);
    return mapRow(data);
  }

  async update(id: string, input: UpdatePostInput): Promise<Post> {
    const patch: Record<string, unknown> = {};
    if (input.slug !== undefined) patch.slug = input.slug;
    if (input.title !== undefined) patch.title = input.title;
    if (input.excerpt !== undefined) patch.excerpt = input.excerpt;
    if (input.content !== undefined) patch.content = input.content;
    if (input.coverImageUrl !== undefined) patch.cover_image_url = input.coverImageUrl;
    if (input.funnelStage !== undefined) patch.funnel_stage = input.funnelStage;
    if (input.topicCluster !== undefined) patch.topic_cluster = input.topicCluster;
    if (input.relatedPostIds !== undefined) patch.related_post_ids = input.relatedPostIds;
    if (input.keywords !== undefined) patch.keywords = input.keywords;
    if (input.primaryKeyword !== undefined) patch.primary_keyword = input.primaryKeyword;
    if (input.keywordVolume !== undefined) patch.keyword_volume = input.keywordVolume;
    if (input.keywordDifficulty !== undefined) patch.keyword_difficulty = input.keywordDifficulty;
    if (input.metaTitle !== undefined) patch.meta_title = input.metaTitle;
    if (input.metaDescription !== undefined) patch.meta_description = input.metaDescription;
    if (input.ogImage !== undefined) patch.og_image = input.ogImage;
    if (input.readTimeMinutes !== undefined) patch.read_time_minutes = input.readTimeMinutes;
    if (input.publishedAt !== undefined) patch.published_at = input.publishedAt.toISOString();
    patch.updated_at = new Date().toISOString();

    const { data, error } = await this.db
      .from('posts')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update post: ${error.message}`);
    return mapRow(data);
  }
}
