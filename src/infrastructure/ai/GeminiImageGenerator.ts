import { GoogleGenAI } from '@google/genai';
import type { IImageGenerator } from '../../application/use-cases/GenerateCoverImageUseCase';

/**
 * Adapter Pattern — generates images via Google Imagen API using @google/genai SDK.
 * Uses ai.models.generateImages() with Imagen 4 models.
 * Model is configurable via GEMINI_IMAGE_MODEL env var.
 */
export class GeminiImageGenerator implements IImageGenerator {
  private readonly ai: GoogleGenAI;
  private readonly model: string;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    this.model = process.env.GEMINI_IMAGE_MODEL ?? 'imagen-4.0-generate-001';
  }

  async generateImage(prompt: string): Promise<Buffer> {
    const response = await this.ai.models.generateImages({
      model: this.model,
      prompt,
      config: { numberOfImages: 1 },
    });

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBytes) {
      throw new Error('Imagen returned no image data.');
    }

    return Buffer.from(imageBytes, 'base64');
  }
}
