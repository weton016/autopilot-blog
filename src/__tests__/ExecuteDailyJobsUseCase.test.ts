import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecuteDailyJobsUseCase } from '../application/use-cases/ExecuteDailyJobsUseCase';
import type { IJobRepository } from '../domain/blog/repositories/IJobRepository';
import type { GeneratePostUseCase } from '../application/use-cases/GeneratePostUseCase';
import type { GenerateCoverImageUseCase } from '../application/use-cases/GenerateCoverImageUseCase';
import type { ITopicHistoryReader } from '../application/use-cases/ScheduleWeeklyJobsUseCase';
import type { Job } from '../domain/blog/entities/Job';
import type { PostResponseDTO } from '../application/dtos/PostResponseDTO';

function makeJob(id: string): Job {
  return {
    id,
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
  };
}

function makePostDTO(id: string): PostResponseDTO {
  return {
    id,
    slug: 'test-post',
    title: 'Test',
    excerpt: 'Test excerpt',
    content: 'Test content',
    coverImageUrl: null,
    funnelStage: 'TOP',
    topicCluster: 'scheduling',
    relatedPostIds: [],
    keywords: [],
    primaryKeyword: 'scheduling',
    keywordVolume: null,
    keywordDifficulty: null,
    metaTitle: null,
    metaDescription: null,
    ogImage: null,
    readTimeMinutes: 5,
    publishedAt: new Date().toISOString(),
  };
}

describe('ExecuteDailyJobsUseCase', () => {
  let jobRepo: IJobRepository;
  let generatePost: GeneratePostUseCase;
  let generateCoverImage: GenerateCoverImageUseCase;
  let topicHistory: ITopicHistoryReader;
  let useCase: ExecuteDailyJobsUseCase;

  beforeEach(() => {
    jobRepo = {
      findById: vi.fn(),
      findByDate: vi.fn(),
      findPendingByDate: vi.fn().mockResolvedValue([makeJob('job-1'), makeJob('job-2')]),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn().mockImplementation((id, input) => Promise.resolve(makeJob(id))),
    };

    generatePost = {
      execute: vi.fn().mockResolvedValue(makePostDTO('post-1')),
    } as unknown as GeneratePostUseCase;

    generateCoverImage = {
      execute: vi.fn().mockResolvedValue('https://example.com/image.webp'),
    } as unknown as GenerateCoverImageUseCase;

    topicHistory = {
      getUsedTopics: vi.fn().mockResolvedValue([]),
      getUsedKeywords: vi.fn().mockResolvedValue([]),
    };

    useCase = new ExecuteDailyJobsUseCase(jobRepo, generatePost, generateCoverImage, topicHistory);
  });

  it('processes all pending jobs', async () => {
    const result = await useCase.execute();
    expect(result.processed).toBe(2);
  });

  it('reports succeeded count correctly', async () => {
    const result = await useCase.execute();
    expect(result.succeeded).toBe(2);
    expect(result.failed).toBe(0);
  });

  it('marks job as RUNNING then DONE', async () => {
    await useCase.execute();
    const updateCalls = vi.mocked(jobRepo.update).mock.calls;
    const runningCall = updateCalls.find(([, input]) => input.status === 'RUNNING');
    const doneCall = updateCalls.find(([, input]) => input.status === 'DONE');
    expect(runningCall).toBeTruthy();
    expect(doneCall).toBeTruthy();
  });

  it('marks job as FAILED on error', async () => {
    vi.mocked(generatePost.execute).mockRejectedValueOnce(new Error('AI failure'));
    const result = await useCase.execute();
    expect(result.failed).toBe(1);
    expect(result.succeeded).toBe(1);
  });

  it('continues processing after one failure', async () => {
    vi.mocked(generatePost.execute)
      .mockRejectedValueOnce(new Error('first fails'))
      .mockResolvedValueOnce(makePostDTO('post-2'));

    const result = await useCase.execute();
    expect(result.processed).toBe(2);
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(1);
  });
});
