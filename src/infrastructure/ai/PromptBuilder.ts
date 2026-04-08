import type { GeneratePostDTO } from '../../application/dtos/GeneratePostDTO';
import type { IPromptBuilder } from '../../application/use-cases/GeneratePostUseCase';
import type { IImagePromptBuilder } from '../../application/use-cases/GenerateCoverImageUseCase';
import type { FunnelStage } from '../../domain/blog/value-objects/FunnelStage';

const FUNNEL_INSTRUCTIONS: Record<FunnelStage, { tone: string; objective: string; cta: string }> = {
  TOP: {
    tone: 'educational, friendly, and approachable',
    objective: 'raise awareness and educate readers about the problem space',
    cta: 'Introduce the reader to tools and solutions that can help',
  },
  MIDDLE: {
    tone: 'analytical, comparative, and helpful',
    objective: 'help readers evaluate options and consider solutions',
    cta: 'Compare features and guide readers toward making a decision',
  },
  BOTTOM: {
    tone: 'persuasive, confident, and action-oriented',
    objective: 'convert readers who are ready to decide',
    cta: 'Encourage readers to start a free trial or sign up immediately',
  },
};

/**
 * Builder Pattern — assembles rich prompts for text and image generation.
 */
export class PromptBuilder implements IPromptBuilder, IImagePromptBuilder {
  private readonly blogTopic = process.env.BLOG_TOPIC ?? '';
  private readonly websiteUrl = process.env.WEBSITE_URL ?? '';
  private readonly language = process.env.CONTENT_LANGUAGE ?? 'English';

  buildPostPrompt(dto: GeneratePostDTO): string {
    const instructions = FUNNEL_INSTRUCTIONS[dto.funnelStage];
    const avoidSection = dto.usedTopics.length
      ? `\n\nTopics to AVOID (already covered):\n${dto.usedTopics.slice(0, 20).join(', ')}`
      : '';

    const keywordSection = dto.primaryKeyword
      ? `\n\nPrimary keyword (SEO anchor): "${dto.primaryKeyword}"
- Use it in the title
- Use it in the first paragraph
- Use it in at least one H2 subheading
- Use it in the meta description
Secondary keywords to include naturally: ${dto.keywordsToTarget.slice(1).join(', ') || 'none'}`
      : '';

    return `You are an expert SEO content writer for a blog about: ${this.blogTopic}
Website: ${this.websiteUrl}
Language: Write the ENTIRE post (title, excerpt, content, meta) in ${this.language}.

Write a complete blog post for the ${dto.funnelStage} funnel stage.
Topic hint: ${dto.topicHint}
${keywordSection}

Tone: ${instructions.tone}
Objective: ${instructions.objective}
CTA guidance: ${instructions.cta}
${avoidSection}

Return a JSON object with EXACTLY this structure:
{
  "title": "SEO-friendly title (50-60 chars)",
  "slug": "url-friendly-slug",
  "excerpt": "150-160 character excerpt with primary keyword",
  "content": "Full markdown content (1500-2500 words). Do NOT include the title as H1 — start directly with the first paragraph. Use ## for H2 sections, ### for H3. Include primary keyword in the first paragraph, at least one H2, and a conclusion.",
  "metaTitle": "Meta title with primary keyword (50-60 chars)",
  "metaDescription": "Meta description with primary keyword (150-160 chars)",
  "keywords": ["primary", "secondary", "keyword", "list"],
  "primaryKeyword": "${dto.primaryKeyword ?? dto.topicHint}",
  "topicCluster": "main topic cluster (3-5 words)",
  "readTimeMinutes": 7,
  "funnelStage": "${dto.funnelStage}"
}

Return ONLY the JSON object. No markdown fences, no extra text.`;
  }

  buildUnsplashQuery(title: string, excerpt: string): string {
    return `Generate a concise Unsplash image search query (3-5 English keywords) for a blog post cover image.

Blog post title: "${title}"
Summary: "${excerpt}"

Rules:
- Return ONLY the keywords, no explanation, no punctuation
- Use English regardless of the post language
- Focus on the core visual concept (people, objects, scenes) — avoid abstract terms
- Prefer terms that yield high-quality photographic results on Unsplash
- Example outputs: "freelancer working laptop coffee" or "team meeting office collaboration"

Keywords:`;
  }

  buildImagePrompt(title: string, excerpt: string): string {
    return `Professional blog cover illustration. Absolutely no text, letters, words, numbers, labels, or typography of any kind anywhere in the image.

The illustration must visually represent the concept of this article:
Title: "${title}"
Summary: "${excerpt}"

Translate the core idea of that content into a concrete visual metaphor or scene. For example:
- If the article is about productivity tools, show organized workflows, clean dashboards, or symbolic objects like calendars and checkmarks.
- If it is about freelancing or business, show a person working, handshakes, or professional environments.
- If it is about technology, show abstract circuits, connected nodes, or modern devices.
- Always derive the visual concept directly from the article's subject matter.

Style:
- Modern flat or soft 3D illustration style
- Clean, minimal, professional aesthetic
- Color palette: deep blues, teals, and whites with accent colors fitting the topic
- Widescreen composition (16:9 ratio), suitable for a blog post hero image
- High visual quality, engaging and polished

IMPORTANT: The image must contain zero text elements. No banners, labels, captions, UI text, or watermarks.`;
  }
}
