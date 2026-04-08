export type FunnelStage = 'TOP' | 'MIDDLE' | 'BOTTOM';

export const FUNNEL_STAGES: FunnelStage[] = ['TOP', 'MIDDLE', 'BOTTOM'];

export function isFunnelStage(value: string): value is FunnelStage {
  return FUNNEL_STAGES.includes(value as FunnelStage);
}
