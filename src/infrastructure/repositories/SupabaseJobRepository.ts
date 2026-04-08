import { createClient } from '@supabase/supabase-js';
import type { IJobRepository } from '../../domain/blog/repositories/IJobRepository';
import type { Job, CreateJobInput, UpdateJobInput } from '../../domain/blog/entities/Job';
import type { FunnelStage } from '../../domain/blog/value-objects/FunnelStage';
import type { PostStatus } from '../../domain/blog/value-objects/PostStatus';

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function toDateOnly(date: Date): string {
  return date.toISOString().split('T')[0];
}

function mapRow(row: Record<string, unknown>): Job {
  return {
    id: row.id as string,
    scheduledDate: new Date(row.scheduled_date as string),
    funnelStage: row.funnel_stage as FunnelStage,
    topicHint: row.topic_hint as string,
    primaryKeyword: (row.primary_keyword as string) ?? null,
    keywordsToTarget: (row.keywords_to_target as string[]) ?? [],
    keywordVolume: (row.keyword_volume as number) ?? null,
    keywordDifficulty: (row.keyword_difficulty as number) ?? null,
    status: row.status as PostStatus,
    postId: (row.post_id as string) ?? null,
    errorMessage: (row.error_message as string) ?? null,
    createdAt: new Date(row.created_at as string),
    executedAt: row.executed_at ? new Date(row.executed_at as string) : null,
  };
}

export class SupabaseJobRepository implements IJobRepository {
  private get db() {
    return getClient();
  }

  async findById(id: string): Promise<Job | null> {
    const { data } = await this.db.from('content_jobs').select('*').eq('id', id).single();
    return data ? mapRow(data) : null;
  }

  async findByDate(date: Date): Promise<Job[]> {
    const { data } = await this.db
      .from('content_jobs')
      .select('*')
      .eq('scheduled_date', toDateOnly(date));
    return (data ?? []).map(mapRow);
  }

  async findPendingByDate(date: Date): Promise<Job[]> {
    const { data } = await this.db
      .from('content_jobs')
      .select('*')
      .eq('scheduled_date', toDateOnly(date))
      .eq('status', 'PENDING');
    return (data ?? []).map(mapRow);
  }

  async create(input: CreateJobInput): Promise<Job> {
    const { data, error } = await this.db
      .from('content_jobs')
      .insert(this.toRow(input))
      .select()
      .single();

    if (error) throw new Error(`Failed to create job: ${error.message}`);
    return mapRow(data);
  }

  async createMany(inputs: CreateJobInput[]): Promise<Job[]> {
    const { data, error } = await this.db
      .from('content_jobs')
      .insert(inputs.map((i) => this.toRow(i)))
      .select();

    if (error) throw new Error(`Failed to create jobs: ${error.message}`);
    return (data ?? []).map(mapRow);
  }

  async update(id: string, input: UpdateJobInput): Promise<Job> {
    const patch: Record<string, unknown> = {};
    if (input.status !== undefined) patch.status = input.status;
    if (input.postId !== undefined) patch.post_id = input.postId;
    if (input.errorMessage !== undefined) patch.error_message = input.errorMessage;
    if (input.executedAt !== undefined) patch.executed_at = input.executedAt?.toISOString();

    const { data, error } = await this.db
      .from('content_jobs')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update job: ${error.message}`);
    return mapRow(data);
  }

  private toRow(input: CreateJobInput) {
    return {
      scheduled_date: toDateOnly(input.scheduledDate),
      funnel_stage: input.funnelStage,
      topic_hint: input.topicHint,
      primary_keyword: input.primaryKeyword,
      keywords_to_target: input.keywordsToTarget,
      keyword_volume: input.keywordVolume,
      keyword_difficulty: input.keywordDifficulty,
      status: input.status,
    };
  }
}
