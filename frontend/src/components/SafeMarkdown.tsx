import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface SafeMarkdownProps {
  content: string;
}

export const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ content }) => {
  const sanitizedHtml = useMemo(() => {
    // 1. Parse markdown to raw HTML
    // We use marked.parse synchronously (it returns a string or Promise depending on config, but by default string for synchronous input)
    const rawHtml = marked.parse(content, { async: false }) as string;

    // 2. Sanitize HTML
    // DOMPurify removes malicious tags like <script> and dangerous attributes like `onerror`.
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      USE_PROFILES: { html: true }, // Standard HTML profile
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
        'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
        'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre'
      ],
      // Let's strip <img> since we don't expect or trust user images, or if we do, 
      // DOMPurify strips `onerror` by default anyway. But strictly, let's just strip img.
      FORBID_TAGS: ['script', 'style', 'img'], 
      FORBID_ATTR: ['onerror', 'onload', 'onmouseover'],
    });

    return cleanHtml;
  }, [content]);

  return (
    <div 
      className="prose prose-sm dark:prose-invert max-w-none break-words"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }} 
    />
  );
};
