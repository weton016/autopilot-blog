import type { IJobRepository } from '../../domain/blog/repositories/IJobRepository';
import type { GeneratePostUseCase } from './GeneratePostUseCase';
import type { GenerateCoverImageUseCase } from './GenerateCoverImageUseCase';
import type { ITopicHistoryReader } from './ScheduleWeeklyJobsUseCase';

export interface ExecuteDailyJobsResult {
  processed: number;
  succeeded: number;
  failed: number;
  postIds: string[];
}

export class ExecuteDailyJobsUseCase {
  constructor(
    private readonly jobRepo: IJobRepository,
    private readonly generatePost: GeneratePostUseCase,
    private readonly generateCoverImage: GenerateCoverImageUseCase,
    private readonly topicHistory: ITopicHistoryReader
  ) {}

  async execute(date?: Date): Promise<ExecuteDailyJobsResult> {
    const targetDate = date ?? new Date();
    const jobs = await this.jobRepo.findPendingByDate(targetDate);

    const usedTopics = await this.topicHistory.getUsedTopics();

    const result: ExecuteDailyJobsResult = {
      processed: jobs.length,
      succeeded: 0,
      failed: 0,
      postIds: [],
    };

    for (const job of jobs) {
      try {
        console.log(`[ExecuteDailyJobs] Processing job ${job.id} (${job.funnelStage})`);
        await this.jobRepo.update(job.id, { status: 'RUNNING' });

        const post = await this.generatePost.execute({
          jobId: job.id,
          funnelStage: job.funnelStage,
          topicHint: job.topicHint,
          primaryKeyword: job.primaryKeyword,
          keywordsToTarget: job.keywordsToTarget,
          usedTopics,
        });

        await this.generateCoverImage.execute(post.id);

        await this.jobRepo.update(job.id, {
          status: 'DONE',
          postId: post.id,
          executedAt: new Date(),
        });

        result.succeeded++;
        result.postIds.push(post.id);
      } catch (err) {
        console.error(`[ExecuteDailyJobs] Job ${job.id} failed:`, err);
        await this.jobRepo.update(job.id, {
          status: 'FAILED',
          errorMessage: err instanceof Error ? err.message : String(err),
          executedAt: new Date(),
        });
        result.failed++;
      }
    }

    return result;
  }
}
