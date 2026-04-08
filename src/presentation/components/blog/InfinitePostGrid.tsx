'use client';

import { useEffect, useRef, useState } from 'react';
import { PostCard } from './PostCard';
import type { PostResponseDTO } from '../../../application/dtos/PostResponseDTO';

const PAGE_SIZE = 9;

interface InfinitePostGridProps {
  initialPosts: PostResponseDTO[];
  initialHasMore: boolean;
}

export function InfinitePostGrid({ initialPosts, initialHasMore }: InfinitePostGridProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, posts.length]);

  async function loadMore() {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts?offset=${posts.length}`);
      const data: { posts: PostResponseDTO[]; hasMore: boolean } = await res.json();
      setPosts((prev) => [...prev, ...data.posts]);
      setHasMore(data.hasMore);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      <div ref={sentinelRef} className="h-4" />

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!hasMore && posts.length >= PAGE_SIZE && (
        <p className="text-center text-sm text-muted-foreground py-8">
          Você chegou ao fim.
        </p>
      )}
    </>
  );
}
