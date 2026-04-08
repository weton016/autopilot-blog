'use client';

interface PostContentProps {
  content: string;
}

export function PostContent({ content }: PostContentProps) {
  const html = markdownToHtml(content);
  return (
    <div
      className={[
        // Tailwind Typography prose
        'prose prose-neutral dark:prose-invert',
        // Size & spacing
        'prose-lg max-w-none',
        // Headings
        'prose-headings:font-bold prose-headings:tracking-tight',
        'prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl',
        'prose-h2:mt-10 prose-h3:mt-8',
        // Body text
        'prose-p:leading-8 prose-p:text-[1.0625rem]',
        // Links
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
        // Code
        'prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-normal prose-code:before:content-none prose-code:after:content-none',
        // Blockquote
        'prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground',
        // Lists
        'prose-li:my-1 prose-ul:my-4 prose-ol:my-4',
        // Images
        'prose-img:rounded-xl prose-img:shadow-md',
        // Hr
        'prose-hr:border-border',
      ].join(' ')}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function markdownToHtml(md: string): string {
  return md
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold & italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // HR
    .replace(/^---$/gm, '<hr />')
    // Unordered lists
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Paragraphs (wrap non-tag lines)
    .replace(/\n\n(.+?)(?=\n\n|$)/gs, (_, p) =>
      p.startsWith('<') ? p : `<p>${p.replace(/\n/g, ' ')}</p>`
    )
    .replace(/\n/g, '<br />');
}
