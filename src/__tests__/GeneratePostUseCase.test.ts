import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeneratePostUseCase } from '../application/use-cases/GeneratePostUseCase';
import type { IPostRepository } from '../domain/blog/repositories/IPostRepository';
import type { IContentGenerator, GeneratedPostData } from '../domain/blog/services/ContentGenerationService';
import type { ITopicHistoryRepository } from '../application/use-cases/GeneratePostUseCase';
import type { IPromptBuilder } from '../application/use-cases/GeneratePostUseCase';
import type { GeneratePostDTO } from '../application/dtos/GeneratePostDTO';
import type { Post } from '../domain/blog/entities/Post';

const mockPost: Post = {
  id: 'post-1',
  slug: 'test-scheduling-tips',
  title: 'Test Scheduling Tips',
  excerpt: 'Tips for scheduling your day effectively.',
  content: 'Full content here...',
  coverImageUrl: null,
  funnelStage: 'TOP',
  topicCluster: 'scheduling',
  relatedPostIds: [],
  keywords: ['scheduling', 'tips'],
  primaryKeyword: 'scheduling tips',
  keywordVolume: 1200,
  keywordDifficulty: 25,
  metaTitle: 'Test Scheduling Tips | <your-website>',
  metaDescription: 'Tips for scheduling your day effectively.',
  ogImage: null,
  readTimeMinutes: 5,
  publishedAt: new Date('2026-01-01'),
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockGeneratedData: GeneratedPostData = {
  title: 'Test Scheduling Tips',
  slug: 'test-scheduling-tips',
  excerpt: 'Tips for scheduling your day effectively.',
  content: 'Full content here with scheduling tips in the first paragraph...',
  metaTitle: 'Test Scheduling Tips | <your-website>',
  metaDescription: 'Tips for scheduling your day effectively.',
  keywords: ['scheduling', 'tips'],
  primaryKeyword: 'scheduling tips',
  topicCluster: 'scheduling',
  readTimeMinutes: 5,
  funnelStage: 'TOP',
};

describe('GeneratePostUseCase', () => {
  let postRepo: IPostRepository;
  let topicHistoryRepo: ITopicHistoryRepository;
  let promptBuilder: IPromptBuilder;
  let contentGenerator: IContentGenerator;
  let useCase: GeneratePostUseCase;

  beforeEach(() => {
    postRepo = {
      findById: vi.fn().mockResolvedValue(mockPost),
      findBySlug: vi.fn().mockResolvedValue(mockPost),
      findAll: vi.fn().mockResolvedValue([mockPost]),
      findByFunnelStage: vi.fn().mockResolvedValue([]),
      findByTopicCluster: vi.fn().mockResolvedValue([]),
      findByKeywords: vi.fn().mockResolvedValue([]),
      search: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue(mockPost),
      update: vi.fn().mockResolvedValue(mockPost),
    };

    topicHistoryRepo = {
      save: vi.fn().mockResolvedValue(undefined),
    };

    promptBuilder = {
      buildPostPrompt: vi.fn().mockReturnValue('mocked prompt'),
    };

    contentGenerator = {
      generatePost: vi.fn().mockResolvedValue(mockGeneratedData),
    };

    useCase = new GeneratePostUseCase(
      postRepo,
      topicHistoryRepo,
      promptBuilder,
      contentGenerator
    );
  });

  it('calls prompt builder with the DTO', async () => {
    const dto: GeneratePostDTO = {
      jobId: 'job-1',
      funnelStage: 'TOP',
      topicHint: 'scheduling tips',
      primaryKeyword: 'scheduling tips',
      keywordsToTarget: ['scheduling', 'tips'],
      usedTopics: [],
    };

    await useCase.execute(dto);

    expect(promptBuilder.buildPostPrompt).toHaveBeenCalledWith(dto);
  });

  it('creates a post with the generated data', async () => {
    const dto: GeneratePostDTO = {
      jobId: 'job-1',
      funnelStage: 'TOP',
      topicHint: 'scheduling tips',
      primaryKeyword: 'scheduling tips',
      keywordsToTarget: ['scheduling'],
      usedTopics: [],
    };

    await useCase.execute(dto);

    expect(postRepo.create).toHaveBeenCalledOnce();
  });

  it('saves topic to history after creation', async () => {
    const dto: GeneratePostDTO = {
      jobId: 'job-1',
      funnelStage: 'TOP',
      topicHint: 'scheduling',
      primaryKeyword: null,
      keywordsToTarget: [],
      usedTopics: [],
    };

    await useCase.execute(dto);

    expect(topicHistoryRepo.save).toHaveBeenCalledOnce();
  });

  it('returns a PostResponseDTO', async () => {
    const dto: GeneratePostDTO = {
      jobId: 'job-1',
      funnelStage: 'TOP',
      topicHint: 'scheduling',
      primaryKeyword: 'scheduling',
      keywordsToTarget: [],
      usedTopics: [],
    };

    const result = await useCase.execute(dto);

    expect(result).toMatchObject({
      slug: mockPost.slug,
      title: mockPost.title,
    });
  });
});
