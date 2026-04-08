import Image from 'next/image';
import Link from 'next/link';
import type { PostResponseDTO } from '../../../application/dtos/PostResponseDTO';

const FUNNEL_COLORS = {
  TOP: 'bg-blue-100 text-blue-700',
  MIDDLE: 'bg-purple-100 text-purple-700',
  BOTTOM: 'bg-green-100 text-green-700',
} as const;

interface PostCardProps {
  post: PostResponseDTO;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="group rounded-2xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
      {post.coverImageUrl && (
        <div className="relative aspect-[1200/630] w-full overflow-hidden">
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${FUNNEL_COLORS[post.funnelStage]}`}
          >
            {post.funnelStage}
          </span>
          {post.readTimeMinutes && (
            <span className="text-xs text-muted-foreground">{post.readTimeMinutes} min de leitura</span>
          )}
        </div>
        <h2 className="text-lg font-bold leading-snug group-hover:text-primary transition-colors">
          <Link href={`/${post.slug}`} className="hover:underline">
            {post.title}
          </Link>
        </h2>
        <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
        <time className="text-xs text-muted-foreground" dateTime={post.publishedAt}>
          {new Date(post.publishedAt).toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
      </div>
    </article>
  );
}
