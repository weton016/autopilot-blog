import type { IPostRepository } from '../../domain/blog/repositories/IPostRepository';

export interface IImageGenerator {
  generateImage(prompt: string): Promise<Buffer>;
}

export interface IStorageAdapter {
  upload(bucket: string, path: string, data: Buffer, contentType: string): Promise<string>;
}

export interface IImagePromptBuilder {
  buildImagePrompt(title: string, excerpt: string): string;
  buildUnsplashQuery(title: string, excerpt: string): string;
}

export class GenerateCoverImageUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly imageGenerator: IImageGenerator,
    private readonly storage: IStorageAdapter,
    private readonly promptBuilder: IImagePromptBuilder
  ) { }

  async execute(postId: string): Promise<string> {
    const post = await this.postRepo.findById(postId);
    if (!post) throw new Error(`Post not found: ${postId}`);

    const prompt = this.promptBuilder.buildImagePrompt(post.title, post.excerpt);
    const imageBuffer = await this.imageGenerator.generateImage(prompt);

    console.log('image generated!', imageBuffer);
    const fileName = `${post.slug}.webp`;
    const publicUrl = await this.storage.upload('post-covers', fileName, imageBuffer, 'image/webp');
    await this.postRepo.update(postId, {
      coverImageUrl: publicUrl,
      ogImage: publicUrl,
    });
    return publicUrl;
  }
}
