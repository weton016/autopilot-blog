import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScheduleWeeklyJobsUseCase } from '../application/use-cases/ScheduleWeeklyJobsUseCase';
import type { IJobRepository } from '../domain/blog/repositories/IJobRepository';
import type { IKeywordResearchAdapter, ITopicHistoryReader } from '../application/use-cases/ScheduleWeeklyJobsUseCase';
import type { Job } from '../domain/blog/entities/Job';
import type { Keyword } from '../domain/blog/entities/Keyword';

const sampleKeywords: Keyword[] = [
  { text: 'scheduling app', volume: 2000, difficulty: 25, cpc: 2 },
  { text: 'appointment booking', volume: 1500, difficulty: 20, cpc: 1.5 },
  { text: 'client management', volume: 1200, difficulty: 30, cpc: 1.8 },
];

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: `job-${Math.random()}`,
    scheduledDate: new Date(),
    funnelStage: 'TOP',
    topicHint: 'scheduling',
    primaryKeyword: 'scheduling app',
    keywordsToTarget: ['scheduling app'],
    keywordVolume: 2000,
    keywordDifficulty: 25,
    status: 'PENDING',
    postId: null,
    errorMessage: null,
    createdAt: new Date(),
    executedAt: null,
    ...overrides,
  };
}

describe('ScheduleWeeklyJobsUseCase', () => {
  let jobRepo: IJobRepository;
  let keywordResearch: IKeywordResearchAdapter;
  let topicHistory: ITopicHistoryReader;
  let useCase: ScheduleWeeklyJobsUseCase;

  beforeEach(() => {
    jobRepo = {
      findById: vi.fn(),
      findByDate: vi.fn(),
      findPendingByDate: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn().mockImplementation((inputs: unknown[]) =>
        Promise.resolve(inputs.map((_: unknown, i: number) => makeJob({ id: `job-${i}` })))
      ),
      update: vi.fn(),
    };

    keywordResearch = {
      fetchKeywords: vi.fn().mockResolvedValue(sampleKeywords),
    };

    topicHistory = {
      getUsedTopics: vi.fn().mockResolvedValue([]),
      getUsedKeywords: vi.fn().mockResolvedValue([]),
    };

    useCase = new ScheduleWeeklyJobsUseCase(jobRepo, keywordResearch, topicHistory);
  });

  it('creates the correct total number of jobs', async () => {
    const result = await useCase.execute(3, 7); // 3 posts/day * 7 days = 21
    expect(result.jobsCreated).toBe(21);
  });

  it('distribution sums to totalPosts', async () => {
    const result = await useCase.execute(3, 7);
    const { TOP, MIDDLE, BOTTOM } = result.distribution;
    expect(TOP + MIDDLE + BOTTOM).toBe(21);
  });

  it('calls keyword research for each funnel stage', async () => {
    await useCase.execute(3, 7);
    expect(keywordResearch.fetchKeywords).toHaveBeenCalledTimes(3);
  });

  it('calls createMany with all job inputs', async () => {
    await useCase.execute(3, 7);
    expect(jobRepo.createMany).toHaveBeenCalledOnce();
    const [inputs] = vi.mocked(jobRepo.createMany).mock.calls[0];
    expect(inputs).toHaveLength(21);
  });
});
