import { createClient } from '@supabase/supabase-js';
import type { ITopicHistoryRepository } from '../../application/use-cases/GeneratePostUseCase';
import type { ITopicHistoryReader } from '../../application/use-cases/ScheduleWeeklyJobsUseCase';

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export class SupabaseTopicHistoryRepository
  implements ITopicHistoryRepository, ITopicHistoryReader
{
  private get db() {
    return getClient();
  }

  async save(
    topic: string,
    funnelStage: string,
    primaryKeyword: string | null,
    keywords: string[]
  ): Promise<void> {
    await this.db.from('topic_history').insert({
      topic,
      funnel_stage: funnelStage,
      primary_keyword: primaryKeyword,
      keywords,
    });
  }

  async getUsedTopics(): Promise<string[]> {
    const { data } = await this.db
      .from('topic_history')
      .select('topic')
      .order('created_at', { ascending: false })
      .limit(100);
    return (data ?? []).map((row) => row.topic as string);
  }

  async getUsedKeywords(): Promise<string[]> {
    const { data } = await this.db
      .from('topic_history')
      .select('primary_keyword, keywords')
      .order('created_at', { ascending: false })
      .limit(100);

    const all: string[] = [];
    for (const row of data ?? []) {
      if (row.primary_keyword) all.push(row.primary_keyword as string);
      if (Array.isArray(row.keywords)) all.push(...(row.keywords as string[]));
    }
    return [...new Set(all)];
  }
}
