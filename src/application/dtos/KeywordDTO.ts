import type { FunnelStage } from '../../domain/blog/value-objects/FunnelStage';

export interface KeywordDTO {
  text: string;
  volume: number;
  difficulty: number;
  cpc: number;
  funnelStage?: FunnelStage;
}
