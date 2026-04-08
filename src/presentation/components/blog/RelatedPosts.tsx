import type { PostResponseDTO } from '../../../application/dtos/PostResponseDTO';
import { PostCard } from './PostCard';

interface RelatedPostsProps {
  posts: PostResponseDTO[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (!posts.length) return null;

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Artigos Relacionados</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
