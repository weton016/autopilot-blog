import type { IPostRepository } from '../../domain/blog/repositories/IPostRepository';
import type { IContentGenerator } from '../../domain/blog/services/ContentGenerationService';
import { ContentGenerationService, calculateReadTime } from '../../domain/blog/services/ContentGenerationService';
import type { GeneratePostDTO } from '../dtos/GeneratePostDTO';
import type { PostResponseDTO } from '../dtos/PostResponseDTO';
import { postToDTO } from '../mappers/postMapper';

export interface ITopicHistoryRepository {
  save(topic: string, funnelStage: string, primaryKeyword: string | null, keywords: string[]): Promise<void>;
}

export interface IPromptBuilder {
  buildPostPrompt(dto: GeneratePostDTO): string;
}

export class GeneratePostUseCase {
  private readonly contentService: ContentGenerationService;

  constructor(
    private readonly postRepo: IPostRepository,
    private readonly topicHistoryRepo: ITopicHistoryRepository,
    private readonly promptBuilder: IPromptBuilder,
    generator: IContentGenerator
  ) {
    this.contentService = new ContentGenerationService(generator);
  }

  async execute(dto: GeneratePostDTO): Promise<PostResponseDTO> {
    const prompt = this.promptBuilder.buildPostPrompt(dto);
    const generated = await this.contentService.generate(prompt);

    // Recalculate read time from actual content
    generated.readTimeMinutes = calculateReadTime(generated.content);

    // Find related posts by topic cluster and keywords
    const relatedPosts = await this.findRelatedPosts(
      generated.topicCluster,
      generated.keywords,
      dto.funnelStage
    );
    const relatedPostIds = relatedPosts.map((p) => p.id);

    const input = this.contentService.buildCreatePostInput(generated, relatedPostIds);

    // Inject keyword metrics from job
    const post = await this.postRepo.create({
      ...input,
      keywordVolume: null,
      keywordDifficulty: null,
    });

    // Record in topic history to avoid repetition
    await this.topicHistoryRepo.save(
      generated.topicCluster ?? generated.title,
      dto.funnelStage,
      generated.primaryKeyword,
      generated.keywords
    );

    return postToDTO(post);
  }

  private async findRelatedPosts(
    topicCluster: string | null,
    keywords: string[],
    funnelStage: string
  ) {
    const byCluster = topicCluster
      ? await this.postRepo.findByTopicCluster(topicCluster)
      : [];

    const byKeywords = await this.postRepo.findByKeywords(keywords);

    const all = [...byCluster, ...byKeywords];
    const seen = new Set<string>();
    return all.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    }).slice(0, 5);
  }
}
