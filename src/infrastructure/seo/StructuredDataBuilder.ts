import type { PostResponseDTO } from '../../application/dtos/PostResponseDTO';

export interface ArticleJsonLd {
  '@context': string;
  '@type': string;
  headline: string;
  description: string;
  image: string[];
  datePublished: string;
  dateModified: string;
  author: { '@type': string; name: string };
  publisher: { '@type': string; name: string; logo: { '@type': string; url: string } };
  url: string;
  keywords: string;
}

export class StructuredDataBuilder {
  static buildArticle(
    post: PostResponseDTO,
    websiteUrl: string,
    blogName: string,
    logoUrl: string
  ): ArticleJsonLd {
    const url = `${websiteUrl}/${post.slug}`;
    const ogImage = post.ogImage ?? post.coverImageUrl ?? '';

    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.excerpt,
      image: ogImage ? [ogImage] : [],
      datePublished: post.publishedAt,
      dateModified: post.publishedAt,
      author: {
        '@type': 'Organization',
        name: blogName,
      },
      publisher: {
        '@type': 'Organization',
        name: blogName,
        logo: { '@type': 'ImageObject', url: logoUrl },
      },
      url,
      keywords: post.keywords.join(', '),
    };
  }
}
