import type { Keyword } from '../entities/Keyword';
import { KeywordMetrics } from '../value-objects/KeywordMetrics';

export class KeywordResearchService {
  filterAndRank(
    keywords: Keyword[],
    options: { minVolume?: number; maxDifficulty?: number } = {}
  ): Keyword[] {
    const { minVolume = 100, maxDifficulty = 40 } = options;

    return keywords
      .filter((kw) => {
        const metrics = new KeywordMetrics(kw.volume, kw.difficulty, kw.cpc);
        return metrics.meetsThreshold(minVolume, maxDifficulty);
      })
      .sort((a, b) => {
        const scoreA = new KeywordMetrics(a.volume, a.difficulty, a.cpc).opportunityScore;
        const scoreB = new KeywordMetrics(b.volume, b.difficulty, b.cpc).opportunityScore;
        return scoreB - scoreA;
      });
  }

  pickBest(keywords: Keyword[], count: number): Keyword[] {
    return this.filterAndRank(keywords).slice(0, count);
  }

  deduplicateAgainstHistory(
    keywords: Keyword[],
    usedKeywords: string[]
  ): Keyword[] {
    const usedSet = new Set(usedKeywords.map((k) => k.toLowerCase()));
    return keywords.filter((kw) => !usedSet.has(kw.text.toLowerCase()));
  }
}
