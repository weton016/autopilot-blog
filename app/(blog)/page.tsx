import { ListPostsUseCase } from '@/src/application/use-cases/ListPostsUseCase';
import { SupabasePostRepository } from '@/src/infrastructure/repositories/SupabasePostRepository';
import { InfinitePostGrid } from '@/src/presentation/components/blog/InfinitePostGrid';
import type { PostResponseDTO } from '@/src/application/dtos/PostResponseDTO';

export const revalidate = 3600;

export const metadata = {
  title: 'Blog | <your-website>',
  description: 'Dicas de agendamento, guias de gestão de clientes e ferramentas para freelancers e pequenas empresas.',
};

const PAGE_SIZE = 9;

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

async function getInitialPosts(query?: string): Promise<{ posts: PostResponseDTO[]; hasMore: boolean }> {
  const repo = new SupabasePostRepository();

  if (query?.trim()) {
    const results = await repo.search(query.trim(), { limit: PAGE_SIZE + 1 });
    const posts = results.slice(0, PAGE_SIZE).map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      coverImageUrl: p.coverImageUrl,
      funnelStage: p.funnelStage,
      topicCluster: p.topicCluster,
      relatedPostIds: p.relatedPostIds,
      keywords: p.keywords,
      primaryKeyword: p.primaryKeyword,
      keywordVolume: p.keywordVolume,
      keywordDifficulty: p.keywordDifficulty,
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
      ogImage: p.ogImage,
      readTimeMinutes: p.readTimeMinutes,
      publishedAt: p.publishedAt.toISOString(),
    }));
    return { posts, hasMore: results.length > PAGE_SIZE };
  }

  const all = await new ListPostsUseCase(repo).execute({ limit: PAGE_SIZE + 1 });
  return { posts: all.slice(0, PAGE_SIZE), hasMore: all.length > PAGE_SIZE };
}

export default async function BlogPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const { posts, hasMore } = await getInitialPosts(q);

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">


      {posts.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground text-lg">
            {q ? `Nenhum artigo encontrado para "${q}".` : 'Nenhum post publicado ainda. Volte em breve!'}
          </p>
        </div>
      ) : (
        <InfinitePostGrid initialPosts={posts} initialHasMore={hasMore} />
      )}
    </main>
  );
}
