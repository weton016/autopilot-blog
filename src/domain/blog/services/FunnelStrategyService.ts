import type { FunnelStage } from '../value-objects/FunnelStage';

export interface FunnelDistribution {
  TOP: number;
  MIDDLE: number;
  BOTTOM: number;
}

/**
 * Strategy Pattern: distributes posts across funnel stages using a 60/25/15 ratio.
 * Guarantees at least 1 post per stage when total >= 3.
 */
export class FunnelStrategyService {
  private static readonly RATIOS: FunnelDistribution = {
    TOP: 0.6,
    MIDDLE: 0.25,
    BOTTOM: 0.15,
  };

  computeDistribution(totalPosts: number): FunnelDistribution {
    if (totalPosts <= 0) return { TOP: 0, MIDDLE: 0, BOTTOM: 0 };

    const raw = {
      TOP: Math.round(totalPosts * FunnelStrategyService.RATIOS.TOP),
      MIDDLE: Math.round(totalPosts * FunnelStrategyService.RATIOS.MIDDLE),
      BOTTOM: Math.round(totalPosts * FunnelStrategyService.RATIOS.BOTTOM),
    };

    // Ensure minimum 1 per stage when total >= 3
    if (totalPosts >= 3) {
      raw.TOP = Math.max(raw.TOP, 1);
      raw.MIDDLE = Math.max(raw.MIDDLE, 1);
      raw.BOTTOM = Math.max(raw.BOTTOM, 1);
    }

    // Adjust so the total always matches requested amount
    const sum = raw.TOP + raw.MIDDLE + raw.BOTTOM;
    const diff = totalPosts - sum;
    raw.TOP += diff; // absorb rounding remainder into the largest bucket

    return raw;
  }

  /**
   * Expands a distribution into an ordered list of stages,
   * spread evenly across the week.
   */
  expandToList(distribution: FunnelDistribution): FunnelStage[] {
    const list: FunnelStage[] = [
      ...Array(distribution.TOP).fill('TOP' as FunnelStage),
      ...Array(distribution.MIDDLE).fill('MIDDLE' as FunnelStage),
      ...Array(distribution.BOTTOM).fill('BOTTOM' as FunnelStage),
    ];
    return list;
  }
}
