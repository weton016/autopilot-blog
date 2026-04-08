import { NextResponse } from 'next/server';
import { ListPostsUseCase } from '@/src/application/use-cases/ListPostsUseCase';
import { SupabasePostRepository } from '@/src/infrastructure/repositories/SupabasePostRepository';

const PAGE_SIZE = 9;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const offset = Number(searchParams.get('offset') ?? 0);

  const posts = await new ListPostsUseCase(new SupabasePostRepository()).execute({
    limit: PAGE_SIZE + 1,
    offset,
  });

  const hasMore = posts.length > PAGE_SIZE;
  return NextResponse.json({ posts: posts.slice(0, PAGE_SIZE), hasMore });
}
