import type { Keyword } from '../entities/Keyword';

export interface IKeywordRepository {
  findByText(keyword: string): Promise<Keyword | null>;
  findMany(keywords: string[]): Promise<Keyword[]>;
  upsert(keyword: Keyword): Promise<Keyword>;
  upsertMany(keywords: Keyword[]): Promise<Keyword[]>;
  isStale(keyword: string, ttlDays?: number): Promise<boolean>;
}
