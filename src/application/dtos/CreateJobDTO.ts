import type { FunnelStage } from '../../domain/blog/value-objects/FunnelStage';

export interface CreateJobDTO {
  scheduledDate: string; // ISO date string YYYY-MM-DD
  funnelStage: FunnelStage;
  topicHint: string;
  primaryKeyword?: string;
  keywordsToTarget?: string[];
  keywordVolume?: number;
  keywordDifficulty?: number;
}
