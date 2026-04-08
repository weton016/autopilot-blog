import type { Job, CreateJobInput, UpdateJobInput } from '../entities/Job';

export interface IJobRepository {
  findById(id: string): Promise<Job | null>;
  findByDate(date: Date): Promise<Job[]>;
  findPendingByDate(date: Date): Promise<Job[]>;
  create(input: CreateJobInput): Promise<Job>;
  createMany(inputs: CreateJobInput[]): Promise<Job[]>;
  update(id: string, input: UpdateJobInput): Promise<Job>;
}
