import type { IPostRepository } from '../../domain/blog/repositories/IPostRepository';
import type { PostResponseDTO } from '../dtos/PostResponseDTO';
import { postToDTO } from '../mappers/postMapper';

export class GetPostUseCase {
  constructor(private readonly postRepo: IPostRepository) {}

  async execute(slug: string): Promise<PostResponseDTO | null> {
    const post = await this.postRepo.findBySlug(slug);
    if (!post) return null;
    return postToDTO(post);
  }
}
