import type { Post } from '../entities/Post';

export class PostCreatedEvent {
  readonly occurredAt: Date;

  constructor(readonly post: Post) {
    this.occurredAt = new Date();
  }
}
