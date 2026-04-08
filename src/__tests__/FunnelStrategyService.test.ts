import { describe, it, expect } from 'vitest';
import { FunnelStrategyService } from '../domain/blog/services/FunnelStrategyService';

describe('FunnelStrategyService', () => {
  const service = new FunnelStrategyService();

  it('returns zeros for totalPosts = 0', () => {
    const result = service.computeDistribution(0);
    expect(result).toEqual({ TOP: 0, MIDDLE: 0, BOTTOM: 0 });
  });

  it('sums to totalPosts exactly', () => {
    for (const total of [1, 3, 7, 10, 21]) {
      const dist = service.computeDistribution(total);
      expect(dist.TOP + dist.MIDDLE + dist.BOTTOM).toBe(total);
    }
  });

  it('ensures at least 1 per stage when totalPosts >= 3', () => {
    const dist = service.computeDistribution(3);
    expect(dist.TOP).toBeGreaterThanOrEqual(1);
    expect(dist.MIDDLE).toBeGreaterThanOrEqual(1);
    expect(dist.BOTTOM).toBeGreaterThanOrEqual(1);
  });

  it('respects 60/25/15 ratio approximately for large totals', () => {
    const dist = service.computeDistribution(100);
    expect(dist.TOP).toBeCloseTo(60, -1);
    expect(dist.MIDDLE).toBeCloseTo(25, -1);
    expect(dist.BOTTOM).toBeCloseTo(15, -1);
  });

  it('expandToList returns correct count', () => {
    const dist = { TOP: 4, MIDDLE: 2, BOTTOM: 1 };
    const list = service.expandToList(dist);
    expect(list).toHaveLength(7);
    expect(list.filter((s) => s === 'TOP')).toHaveLength(4);
    expect(list.filter((s) => s === 'MIDDLE')).toHaveLength(2);
    expect(list.filter((s) => s === 'BOTTOM')).toHaveLength(1);
  });
});
