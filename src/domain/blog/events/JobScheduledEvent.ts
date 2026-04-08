import type { Job } from '../entities/Job';

export class JobScheduledEvent {
  readonly occurredAt: Date;

  constructor(readonly jobs: Job[]) {
    this.occurredAt = new Date();
  }
}
