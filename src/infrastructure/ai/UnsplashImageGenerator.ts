import OpenAI from 'openai';
import type { IImageGenerator } from '../../application/use-cases/GenerateCoverImageUseCase';

/**
 * Adapter Pattern — fetches cover images from Unsplash.
 * Uses OpenAI (gpt-4o-mini) to convert the context prompt into a concise
 * Unsplash search query, then downloads the best result as a Buffer.
 */
export class UnsplashImageGenerator implements IImageGenerator {
  private readonly openai: OpenAI;
  private readonly accessKey: string;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.accessKey = process.env.UNSPLASH_ACCESS_KEY ?? '';
  }

  async generateImage(contextPrompt: string): Promise<Buffer> {
    const query = await this.buildQuery(contextPrompt);
    const imageUrl = await this.searchUnsplash(query);
    return this.downloadImage(imageUrl);
  }

  private async buildQuery(contextPrompt: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: contextPrompt }],
      temperature: 0.3,
      max_tokens: 20,
    });
    return response.choices[0].message.content?.trim() ?? '';
  }

  private async searchUnsplash(query: string): Promise<string> {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${this.accessKey}&per_page=5&orientation=landscape&content_filter=high`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Unsplash API error: ${res.status}`);

    const data = await res.json() as { results: { urls: { regular: string } }[] };
    const imageUrl = data.results[0]?.urls?.regular;
    if (!imageUrl) throw new Error(`No Unsplash results for query: "${query}"`);

    return imageUrl;
  }

  private async downloadImage(url: string): Promise<Buffer> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
