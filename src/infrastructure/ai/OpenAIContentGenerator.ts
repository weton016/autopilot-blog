import OpenAI from 'openai';
import type { IContentGenerator, GeneratedPostData } from '../../domain/blog/services/ContentGenerationService';

/**
 * Adapter Pattern — wraps OpenAI for structured post generation.
 */
export class OpenAIContentGenerator implements IContentGenerator {
  private readonly client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async generatePost(prompt: string): Promise<GeneratedPostData> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a senior SEO content writer. Always return valid JSON matching the exact schema provided. No markdown code blocks, no extra keys.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error('OpenAI returned empty content');

    const parsed = JSON.parse(raw) as GeneratedPostData;
    this.validate(parsed);
    return parsed;
  }

  private validate(data: GeneratedPostData): void {
    const required = ['title', 'slug', 'excerpt', 'content', 'metaTitle', 'metaDescription', 'keywords', 'primaryKeyword', 'topicCluster', 'funnelStage'];
    for (const field of required) {
      if (!data[field as keyof GeneratedPostData]) {
        throw new Error(`OpenAI response missing required field: ${field}`);
      }
    }
  }
}
