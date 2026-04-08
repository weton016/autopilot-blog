import { describe, it, expect } from 'vitest';
import { KeywordResearchService } from '../domain/blog/services/KeywordResearchService';
import type { Keyword } from '../domain/blog/entities/Keyword';

const sampleKeywords: Keyword[] = [
  { text: 'scheduling software', volume: 5000, difficulty: 30, cpc: 2.5 },
  { text: 'appointment booking', volume: 3000, difficulty: 20, cpc: 1.8 },
  { text: 'hard keyword', volume: 200, difficulty: 70, cpc: 5.0 }, // high difficulty — should be filtered
  { text: 'low volume', volume: 50, difficulty: 10, cpc: 0.5 },   // low volume — should be filtered
  { text: 'calendar app', volume: 1200, difficulty: 35, cpc: 1.0 },
];

describe('KeywordResearchService', () => {
  const service = new KeywordResearchService();

  it('filters out keywords below volume threshold', () => {
    const result = service.filterAndRank(sampleKeywords);
    const texts = result.map((k) => k.text);
    expect(texts).not.toContain('low volume');
  });

  it('filters out keywords above difficulty threshold', () => {
    const result = service.filterAndRank(sampleKeywords);
    const texts = result.map((k) => k.text);
    expect(texts).not.toContain('hard keyword');
  });

  it('returns keywords sorted by opportunity score descending', () => {
    const result = service.filterAndRank(sampleKeywords);
    for (let i = 0; i < result.length - 1; i++) {
      const scoreA = result[i].volume / (result[i].difficulty || 1);
      const scoreB = result[i + 1].volume / (result[i + 1].difficulty || 1);
      expect(scoreA).toBeGreaterThanOrEqual(scoreB);
    }
  });

  it('pickBest returns at most N keywords', () => {
    const result = service.pickBest(sampleKeywords, 2);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('deduplicateAgainstHistory removes already-used keywords', () => {
    const used = ['scheduling software', 'calendar app'];
    const result = service.deduplicateAgainstHistory(sampleKeywords, used);
    const texts = result.map((k) => k.text);
    expect(texts).not.toContain('scheduling software');
    expect(texts).not.toContain('calendar app');
    expect(texts).toContain('appointment booking');
  });
});
