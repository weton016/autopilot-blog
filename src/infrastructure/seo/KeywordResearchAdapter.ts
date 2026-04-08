import OpenAI from 'openai';
import type { FunnelStage } from '../../domain/blog/value-objects/FunnelStage';
import type { Keyword } from '../../domain/blog/entities/Keyword';
import type { IKeywordResearchAdapter } from '../../application/use-cases/ScheduleWeeklyJobsUseCase';
import type { IKeywordRepository } from '../../domain/blog/repositories/IKeywordRepository';

/**
 * Adapter Pattern — generates seed keywords with OpenAI,
 * fetches metrics from DataForSEO, caches results in Supabase.
 */
export class KeywordResearchAdapter implements IKeywordResearchAdapter {
  private readonly openai: OpenAI;
  private readonly blogTopic = process.env.BLOG_TOPIC ?? '';
  private readonly dataForSeoLogin = process.env.DATAFORSEO_LOGIN ?? '';
  private readonly dataForSeoPassword = process.env.DATAFORSEO_PASSWORD ?? '';

  constructor(private readonly keywordRepo: IKeywordRepository) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async fetchKeywords(funnelStage: FunnelStage): Promise<Keyword[]> {
    const seeds = await this.generateSeedKeywords(funnelStage);

    // Check cache first
    const cached = await this.keywordRepo.findMany(seeds);
    const cachedTexts = new Set(cached.map((k) => k.text));
    const uncachedSeeds = seeds.filter((s) => !cachedTexts.has(s));

    let fresh: Keyword[] = [];
    if (uncachedSeeds.length > 0 && this.dataForSeoLogin) {
      fresh = await this.fetchFromDataForSEO(uncachedSeeds);
      if (fresh.length > 0) {
        await this.keywordRepo.upsertMany(fresh);
      }
    }

    return [...cached, ...fresh];
  }

  private async generateSeedKeywords(funnelStage: FunnelStage): Promise<string[]> {
    const stageContext: Record<FunnelStage, string> = {
      TOP: 'awareness stage — broad informational queries, how-to, what-is',
      MIDDLE: 'consideration stage — comparison queries, best options, reviews',
      BOTTOM: 'decision stage — specific product queries, pricing, trials, signup',
    };

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Generate 30 SEO keyword ideas for a blog about: "${this.blogTopic}"
Funnel stage: ${funnelStage} (${stageContext[funnelStage]})

Return a JSON array of 30 keyword strings. Only the array, no explanation.
Example: ["keyword one", "keyword two", ...]`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const raw = response.choices[0]?.message?.content ?? '{"keywords":[]}';
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const arr = (parsed.keywords ?? parsed.data ?? Object.values(parsed)[0]) as string[];
    return Array.isArray(arr) ? arr.slice(0, 30) : [];
  }

  private async fetchFromDataForSEO(keywords: string[]): Promise<Keyword[]> {
    const credentials = Buffer.from(`${this.dataForSeoLogin}:${this.dataForSeoPassword}`).toString('base64');

    const response = await fetch(
      'https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            keywords,
            language_code: 'en',
            location_code: 2840, // US
          },
        ]),
      }
    );

    if (!response.ok) {
      console.warn(`[KeywordResearchAdapter] DataForSEO error: ${response.status}`);
      return [];
    }

    const json = await response.json() as {
      tasks?: Array<{ result?: Array<{ keyword: string; search_volume: number; competition_index: number; cpc?: number }> }>;
    };

    const results = json.tasks?.[0]?.result ?? [];
    return results.map((item) => ({
      text: item.keyword,
      volume: item.search_volume ?? 0,
      difficulty: item.competition_index ?? 0,
      cpc: item.cpc ?? 0,
    }));
  }
}
