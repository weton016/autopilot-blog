import { NextRequest, NextResponse } from 'next/server';
import { ScheduleWeeklyJobsUseCase } from '@/src/application/use-cases/ScheduleWeeklyJobsUseCase';
import { SupabaseJobRepository } from '@/src/infrastructure/repositories/SupabaseJobRepository';
import { SupabaseKeywordRepository } from '@/src/infrastructure/repositories/SupabaseKeywordRepository';
import { SupabaseTopicHistoryRepository } from '@/src/infrastructure/repositories/SupabaseTopicHistoryRepository';
import { KeywordResearchAdapter } from '@/src/infrastructure/seo/KeywordResearchAdapter';

export const maxDuration = 300;

function authorize(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  return authHeader === expected;
}

export async function POST(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const postsPerDay = parseInt(process.env.POSTS_PER_DAY ?? '3', 10);
  const intervalDays = parseInt(process.env.POST_CREATION_INTERVAL_DAYS ?? '7', 10);

  try {
    console.log('[weekly-scheduler] Starting keyword research and job scheduling');

    const jobRepo = new SupabaseJobRepository();
    const keywordRepo = new SupabaseKeywordRepository();
    const topicHistory = new SupabaseTopicHistoryRepository();
    const keywordResearch = new KeywordResearchAdapter(keywordRepo);

    const useCase = new ScheduleWeeklyJobsUseCase(jobRepo, keywordResearch, topicHistory);
    const result = await useCase.execute(postsPerDay, intervalDays);

    console.log(`[weekly-scheduler] Created ${result.jobsCreated} jobs`, result.distribution);

    return NextResponse.json({
      success: true,
      jobsCreated: result.jobsCreated,
      distribution: result.distribution,
    });
  } catch (err) {
    console.error('[weekly-scheduler] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
