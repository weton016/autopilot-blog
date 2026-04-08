import type { FunnelStage } from '../value-objects/FunnelStage';

export interface Keyword {
  text: string;
  volume: number;
  difficulty: number;
  cpc: number;
  funnelStage?: FunnelStage;
}
