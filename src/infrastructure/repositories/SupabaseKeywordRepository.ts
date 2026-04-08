import { createClient } from '@supabase/supabase-js';
import type { IKeywordRepository } from '../../domain/blog/repositories/IKeywordRepository';
import type { Keyword } from '../../domain/blog/entities/Keyword';

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function mapRow(row: Record<string, unknown>): Keyword {
  return {
    text: row.keyword as string,
    volume: (row.volume as number) ?? 0,
    difficulty: (row.difficulty as number) ?? 0,
    cpc: Number((row.cpc as string | number) ?? 0),
  };
}

export class SupabaseKeywordRepository implements IKeywordRepository {
  private get db() {
    return getClient();
  }

  async findByText(keyword: string): Promise<Keyword | null> {
    const { data } = await this.db
      .from('keyword_cache')
      .select('*')
      .eq('keyword', keyword)
      .single();
    return data ? mapRow(data) : null;
  }

  async findMany(keywords: string[]): Promise<Keyword[]> {
    const { data } = await this.db
      .from('keyword_cache')
      .select('*')
      .in('keyword', keywords);
    return (data ?? []).map(mapRow);
  }

  async upsert(keyword: Keyword): Promise<Keyword> {
    const { data, error } = await this.db
      .from('keyword_cache')
      .upsert({
        keyword: keyword.text,
        volume: keyword.volume,
        difficulty: keyword.difficulty,
        cpc: keyword.cpc,
        fetched_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to upsert keyword: ${error.message}`);
    return mapRow(data);
  }

  async upsertMany(keywords: Keyword[]): Promise<Keyword[]> {
    const { data, error } = await this.db
      .from('keyword_cache')
      .upsert(
        keywords.map((kw) => ({
          keyword: kw.text,
          volume: kw.volume,
          difficulty: kw.difficulty,
          cpc: kw.cpc,
          fetched_at: new Date().toISOString(),
        }))
      )
      .select();

    if (error) throw new Error(`Failed to upsert keywords: ${error.message}`);
    return (data ?? []).map(mapRow);
  }

  async isStale(keyword: string, ttlDays = 30): Promise<boolean> {
    const { data } = await this.db
      .from('keyword_cache')
      .select('fetched_at')
      .eq('keyword', keyword)
      .single();

    if (!data) return true;

    const fetchedAt = new Date(data.fetched_at as string);
    const ageMs = Date.now() - fetchedAt.getTime();
    return ageMs > ttlDays * 24 * 60 * 60 * 1000;
  }
}
