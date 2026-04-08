export class KeywordMetrics {
  constructor(
    readonly volume: number,
    readonly difficulty: number,
    readonly cpc: number
  ) {}

  get opportunityScore(): number {
    if (this.difficulty === 0) return this.volume;
    return (this.volume / this.difficulty) * (1 + this.cpc * 0.1);
  }

  meetsThreshold(minVolume = 100, maxDifficulty = 40): boolean {
    return this.volume >= minVolume && this.difficulty <= maxDifficulty;
  }
}
