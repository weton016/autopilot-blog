export type PostStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';

export const POST_STATUSES: PostStatus[] = ['PENDING', 'RUNNING', 'DONE', 'FAILED'];

export function isPostStatus(value: string): value is PostStatus {
  return POST_STATUSES.includes(value as PostStatus);
}
