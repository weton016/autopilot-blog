import { NextRequest, NextResponse } from 'next/server';
import { ExecuteDailyJobsUseCase } from '@/src/application/use-cases/ExecuteDailyJobsUseCase';
import { GeneratePostUseCase } from '@/src/application/use-cases/GeneratePostUseCase';
import { GenerateCoverImageUseCase } from '@/src/application/use-cases/GenerateCoverImageUseCase';
import { SupabaseJobRepository } from '@/src/infrastructure/repositories/SupabaseJobRepository';
import { SupabasePostRepository } from '@/src/infrastructure/repositories/SupabasePostRepository';
import { SupabaseTopicHistoryRepository } from '@/src/infrastructure/repositories/SupabaseTopicHistoryRepository';
import { SupabaseStorageAdapter } from '@/src/infrastructure/storage/SupabaseStorageAdapter';
import { OpenAIContentGenerator } from '@/src/infrastructure/ai/OpenAIContentGenerator';
import { UnsplashImageGenerator } from '@/src/infrastructure/ai/UnsplashImageGenerator';
import { PromptBuilder } from '@/src/infrastructure/ai/PromptBuilder';

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

  try {
    console.log('[daily-executor] Starting daily content execution');

    const postRepo = new SupabasePostRepository();
    const jobRepo = new SupabaseJobRepository();
    const topicHistory = new SupabaseTopicHistoryRepository();
    const storage = new SupabaseStorageAdapter();
    const contentGenerator = new OpenAIContentGenerator();
    const imageGenerator = new UnsplashImageGenerator();
    const promptBuilder = new PromptBuilder();

    const generatePost = new GeneratePostUseCase(
      postRepo,
      topicHistory,
      promptBuilder,
      contentGenerator
    );

    // Use buildUnsplashQuery as the image prompt builder for Unsplash
    // To switch back to Gemini: replace imageGenerator with GeminiImageGenerator
    // and change buildUnsplashQuery to buildImagePrompt below
    const generateCoverImage = new GenerateCoverImageUseCase(
      postRepo,
      imageGenerator,
      storage,
      {
        buildImagePrompt: (t, e) => promptBuilder.buildUnsplashQuery(t, e),
        buildUnsplashQuery: (t, e) => promptBuilder.buildUnsplashQuery(t, e),
      }
    );

    const executeDaily = new ExecuteDailyJobsUseCase(
      jobRepo,
      generatePost,
      generateCoverImage,
      topicHistory
    );

    const result = await executeDaily.execute();

    console.log(
      `[daily-executor] Done: ${result.succeeded} succeeded, ${result.failed} failed`
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error('[daily-executor] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
