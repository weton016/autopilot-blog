export class PostSlug {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(raw: string): PostSlug {
    const slug = raw
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (!slug) throw new Error('Invalid slug: empty after normalization');
    return new PostSlug(slug);
  }

  static fromString(value: string): PostSlug {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)) {
      throw new Error(`Invalid slug format: ${value}`);
    }
    return new PostSlug(value);
  }

  toString(): string {
    return this.value;
  }
}
