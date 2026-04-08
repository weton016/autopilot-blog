import type { IPostRepository } from '../../domain/blog/repositories/IPostRepository';
import type { PostResponseDTO } from '../dtos/PostResponseDTO';
import { postToDTO } from '../mappers/postMapper';

export class ListPostsUseCase {
  constructor(private readonly postRepo: IPostRepository) {}

  async execute(options?: { limit?: number; offset?: number }): Promise<PostResponseDTO[]> {
    const posts = await this.postRepo.findAll(options);
    return posts.map(postToDTO);
  }
}
