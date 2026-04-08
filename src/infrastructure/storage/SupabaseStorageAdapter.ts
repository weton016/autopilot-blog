import { createClient } from '@supabase/supabase-js';
import type { IStorageAdapter } from '../../application/use-cases/GenerateCoverImageUseCase';

/**
 * Adapter — uploads files to Supabase Storage using the service role key.
 */
export class SupabaseStorageAdapter implements IStorageAdapter {
  private get db() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async upload(bucket: string, path: string, data: Buffer, contentType: string): Promise<string> {
    const { error } = await this.db.storage
      .from(bucket)
      .upload(path, data, {
        contentType,
        upsert: true,
      });

    if (error) throw new Error(`Storage upload failed: ${error.message}`);

    const { data: publicData } = this.db.storage.from(bucket).getPublicUrl(path);
    return publicData.publicUrl;
  }
}
