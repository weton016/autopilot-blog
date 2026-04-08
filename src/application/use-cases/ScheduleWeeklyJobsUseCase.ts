import type { IJobRepository } from '../../domain/blog/repositories/IJobRepository';
import type { CreateJobInput } from '../../domain/blog/entities/Job';
import type { FunnelStage } from '../../domain/blog/value-objects/FunnelStage';
import { FunnelStrategyService } from '../../domain/blog/services/FunnelStrategyService';
import { KeywordResearchService } from '../../domain/blog/services/KeywordResearchService';
import type { Keyword } from '../../domain/blog/entities/Keyword';

export interface IKeywordResearchAdapter {
  fetchKeywords(funnelStage: FunnelStage): Promise<Keyword[]>;
}

export interface ITopicHistoryReader {
  getUsedTopics(): Promise<string[]>;
  getUsedKeywords(): Promise<string[]>;
}

export interface ScheduleWeeklyJobsResult {
  jobsCreated: number;
  distribution: { TOP: number; MIDDLE: number; BOTTOM: number };
}

export class ScheduleWeeklyJobsUseCase {
  private readonly funnelStrategy = new FunnelStrategyService();
  private readonly keywordService = new KeywordResearchService();

  constructor(
    private readonly jobRepo: IJobRepository,
    private readonly keywordResearch: IKeywordResearchAdapter,
    private readonly topicHistory: ITopicHistoryReader
  ) { }

  async execute(postsPerDay: number, intervalDays: number): Promise<ScheduleWeeklyJobsResult> {
    const totalPosts = postsPerDay * intervalDays;
    const distribution = this.funnelStrategy.computeDistribution(totalPosts);
    const stages = this.funnelStrategy.expandToList(distribution);

    const usedKeywords = await this.topicHistory.getUsedKeywords();

    // Fetch keywords per stage (reuse cache across stages)
    const keywordsByStage = new Map<FunnelStage, Keyword[]>();
    for (const stage of (['TOP', 'MIDDLE', 'BOTTOM'] as FunnelStage[])) {
      const raw = await this.keywordResearch.fetchKeywords(stage);
      const deduped = this.keywordService.deduplicateAgainstHistory(raw, usedKeywords);
      const filtered = this.keywordService.filterAndRank(deduped);
      // Se o filtro de métricas remover tudo (ex: sem DataForSEO, volume=0),
      // usa a lista deduplicada sem filtro para garantir que o job terá keyword
      keywordsByStage.set(stage, filtered.length > 0 ? filtered : deduped);
    }

    const today = new Date();
    const jobInputs: CreateJobInput[] = [];

    // Track how many of each stage we've used to pick different keywords per post
    const stageCounters = { TOP: 0, MIDDLE: 0, BOTTOM: 0 };

    stages.forEach((stage, index) => {
      const scheduledDate = new Date(today);
      const dayOffset = Math.floor((index / stages.length) * intervalDays);
      scheduledDate.setDate(today.getDate() + dayOffset);

      const keywords = keywordsByStage.get(stage) ?? [];
      const kwIndex = stageCounters[stage]++;
      const primaryKeyword = keywords[kwIndex] ?? null;

      jobInputs.push({
        scheduledDate,
        funnelStage: stage,
        topicHint: primaryKeyword?.text ?? `${stage.toLowerCase()} funnel content`,
        primaryKeyword: primaryKeyword?.text ?? null,
        keywordsToTarget: primaryKeyword ? [primaryKeyword.text] : [],
        keywordVolume: primaryKeyword?.volume ?? null,
        keywordDifficulty: primaryKeyword?.difficulty ?? null,
        status: 'PENDING',
      });
    });

    const created = await this.jobRepo.createMany(jobInputs);

    return { jobsCreated: created.length, distribution };
  }
}
