import type { Metadata } from 'next';
import type { PostResponseDTO } from '../../application/dtos/PostResponseDTO';

/**
 * Factory Pattern — builds Next.js Metadata objects from a PostResponseDTO.
 */
export class MetadataFactory {
  static create(post: PostResponseDTO, websiteUrl: string, blogName: string): Metadata {
    const url = `${websiteUrl}/${post.slug}`;
    const ogImage = post.ogImage ?? post.coverImageUrl ?? undefined;

    return {
      title: post.metaTitle ?? post.title,
      description: post.metaDescription ?? post.excerpt,
      keywords: post.keywords,
      authors: [{ name: blogName }],
      robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
      openGraph: {
        title: post.metaTitle ?? post.title,
        description: post.metaDescription ?? post.excerpt,
        url,
        siteName: blogName,
        images: ogImage
          ? [{ url: ogImage, width: 1200, height: 630, alt: post.title }]
          : [],
        type: 'article',
        publishedTime: post.publishedAt,
      },
      twitter: {
        card: 'summary_large_image',
        title: post.metaTitle ?? post.title,
        description: post.metaDescription ?? post.excerpt,
        images: ogImage ? [ogImage] : [],
      },
      alternates: {
        canonical: url,
      },
    };
  }
}
