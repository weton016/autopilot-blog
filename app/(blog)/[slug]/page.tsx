import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import { GetPostUseCase } from '@/src/application/use-cases/GetPostUseCase';
import { ListPostsUseCase } from '@/src/application/use-cases/ListPostsUseCase';
import { SupabasePostRepository } from '@/src/infrastructure/repositories/SupabasePostRepository';
import { MetadataFactory } from '@/src/infrastructure/seo/MetadataFactory';
import { StructuredDataBuilder } from '@/src/infrastructure/seo/StructuredDataBuilder';
import { PostContent } from '@/src/presentation/components/blog/PostContent';
import { CTABanner } from '@/src/presentation/components/blog/CTABanner';
import { RelatedPosts } from '@/src/presentation/components/blog/RelatedPosts';
import { JsonLd } from '@/src/presentation/components/seo/JsonLd';
import type { PostResponseDTO } from '@/src/application/dtos/PostResponseDTO';

export const revalidate = 604800;

const WEBSITE_URL = process.env.WEBSITE_URL ?? '';
const BLOG_NAME = '<your-website> Blog';
const LOGO_URL = `${WEBSITE_URL}/logo.png`;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  const repo = new SupabasePostRepository();
  return new GetPostUseCase(repo).execute(slug);
}

async function getRelatedPosts(ids: string[]): Promise<PostResponseDTO[]> {
  if (!ids.length) return [];
  const repo = new SupabasePostRepository();
  const posts = await Promise.all(ids.map((id) => repo.findById(id)));
  return posts
    .filter(Boolean)
    .map((p) => ({
      id: p!.id,
      slug: p!.slug,
      title: p!.title,
      excerpt: p!.excerpt,
      content: p!.content,
      coverImageUrl: p!.coverImageUrl,
      funnelStage: p!.funnelStage,
      topicCluster: p!.topicCluster,
      relatedPostIds: p!.relatedPostIds,
      keywords: p!.keywords,
      primaryKeyword: p!.primaryKeyword,
      keywordVolume: p!.keywordVolume,
      keywordDifficulty: p!.keywordDifficulty,
      metaTitle: p!.metaTitle,
      metaDescription: p!.metaDescription,
      ogImage: p!.ogImage,
      readTimeMinutes: p!.readTimeMinutes,
      publishedAt: p!.publishedAt.toISOString(),
    }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Not Found' };
  return MetadataFactory.create(post, WEBSITE_URL, BLOG_NAME);
}

export async function generateStaticParams() {
  const repo = new SupabasePostRepository();
  const posts = await new ListPostsUseCase(repo).execute({ limit: 1000 });
  return posts.map((p) => ({ slug: p.slug }));
}

const FUNNEL_LABELS: Record<string, string> = {
  TOP: 'Introdução',
  MIDDLE: 'Comparativo',
  BOTTOM: 'Guia de Decisão',
};

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const relatedPosts = await getRelatedPosts(post.relatedPostIds);
  const jsonLd = StructuredDataBuilder.buildArticle(post, WEBSITE_URL, BLOG_NAME, LOGO_URL);

  return (
    <>
      <JsonLd data={jsonLd as unknown as Record<string, unknown>} />

      <main className="w-full">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <article className="pt-10 pb-16">
            {/* 1. Meta */}
            <div className="flex flex-wrap items-center gap-2 mb-4 text-sm text-muted-foreground">
              <span className="font-medium text-primary">
                {FUNNEL_LABELS[post.funnelStage] ?? post.funnelStage}
              </span>
              <span>·</span>
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString('pt-BR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              {post.readTimeMinutes && (
                <>
                  <span>·</span>
                  <span>{post.readTimeMinutes} min de leitura</span>
                </>
              )}
            </div>

            {/* 2. Title */}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.2] mb-4">
              {post.title}
            </h1>

            {/* 3. Cover image — constrained, native 1200×630 ratio */}
            {post.coverImageUrl && (
              <div className="relative w-full aspect-[1200/630] rounded-xl overflow-hidden bg-muted mb-6">
                <Image
                  src={post.coverImageUrl}
                  alt={post.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 672px) 100vw, 672px"
                />
              </div>
            )}

            {/* 4. Excerpt / description */}
            <p className="text-lg text-muted-foreground leading-relaxed mb-10 pb-8 border-b border-border">
              {post.excerpt}
            </p>

            {/* Body */}
            <PostContent content={post.content} />

            {/* CTA */}
            <CTABanner funnelStage={post.funnelStage} websiteUrl={WEBSITE_URL} />

            {/* Keywords */}
            {post.keywords.length > 0 && (
              <div className="mt-8 pt-6 border-t border-border flex flex-wrap gap-2">
                {post.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </article>
        </div>

        {/* Related posts — wider container */}
        {relatedPosts.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-4 pb-16">
            <RelatedPosts posts={relatedPosts} />
          </div>
        )}
      </main>
    </>
  );
}
