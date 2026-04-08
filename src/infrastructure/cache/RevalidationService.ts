/**
 * Triggers Next.js on-demand ISR revalidation for blog pages after content is created.
 */
export class RevalidationService {
  private readonly websiteUrl = process.env.WEBSITE_URL ?? '';

  async revalidatePost(slug: string): Promise<void> {
    const path = `/${slug}`;
    await this.revalidatePath(path);
  }

  async revalidateHome(): Promise<void> {
    await this.revalidatePath('/');
  }

  private async revalidatePath(path: string): Promise<void> {
    if (!this.websiteUrl) return;

    try {
      const url = `${this.websiteUrl}/api/revalidate?path=${encodeURIComponent(path)}&secret=${process.env.CRON_SECRET}`;
      await fetch(url, { method: 'POST' });
    } catch (err) {
      console.warn(`[RevalidationService] Failed to revalidate ${path}:`, err);
    }
  }
}
