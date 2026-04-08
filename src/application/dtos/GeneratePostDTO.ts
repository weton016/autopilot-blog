import type { FunnelStage } from '../../domain/blog/value-objects/FunnelStage';

export interface GeneratePostDTO {
  jobId: string;
  funnelStage: FunnelStage;
  topicHint: string;
  primaryKeyword: string | null;
  keywordsToTarget: string[];
  usedTopics: string[];
}
