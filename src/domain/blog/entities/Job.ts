import type { FunnelStage } from '../value-objects/FunnelStage';
import type { PostStatus } from '../value-objects/PostStatus';

export interface Job {
  id: string;
  scheduledDate: Date;
  funnelStage: FunnelStage;
  topicHint: string;
  primaryKeyword: string | null;
  keywordsToTarget: string[];
  keywordVolume: number | null;
  keywordDifficulty: number | null;
  status: PostStatus;
  postId: string | null;
  errorMessage: string | null;
  createdAt: Date;
  executedAt: Date | null;
}

export type CreateJobInput = Omit<Job, 'id' | 'createdAt' | 'executedAt' | 'postId' | 'errorMessage'>;

export type UpdateJobInput = Partial<Pick<Job, 'status' | 'postId' | 'errorMessage' | 'executedAt'>>;
