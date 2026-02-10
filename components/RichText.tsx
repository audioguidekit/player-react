import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';
import styled from 'styled-components';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';
import { useTheme } from 'styled-components';
import { Tooltip } from './Tooltip';

interface RichTextProps {
  content: string;
  className?: string;
}

const Wrapper = styled.span`
  /* Inherit all parent text styles — no resets */

  a {
    color: ${({ theme }) => theme.richText.linkColor};
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  blockquote {
    border-left: 3px solid ${({ theme }) => theme.richText.blockquoteBorderColor};
    background-color: ${({ theme }) => theme.richText.blockquoteBackgroundColor};
    margin: 0.75em 0;
    padding: 0.5em 1em;
  }

  ul {
    margin: 0.5em 0;
    padding-left: 1.5em;
    list-style-type: disc;
  }

  li {
    margin: 0.25em 0;
  }
`;

const ALLOWED_TAGS = [
  'strong', 'em', 'u', 's', 'sup', 'sub', 'small',
  'a', 'ul', 'li', 'blockquote', 'tooltip',
];

const ALLOWED_ATTR = ['href', 'target', 'rel', 'title'];

/** Simple check: does the string contain any HTML-like tags? */
const containsHtml = (str: string): boolean => /<[a-z][\s\S]*>/i.test(str);

/**
 * Sanitize HTML content, forcing safe link attributes.
 */
const sanitize = (html: string): string => {
  // DOMPurify config
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_TAGS: ['tooltip'],
    ADD_ATTR: ['title'],
  });

  // Post-process: force target and rel on <a> tags
  const div = document.createElement('div');
  div.innerHTML = clean;

  div.querySelectorAll('a').forEach((a) => {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
  });

  return div.innerHTML;
};

/**
 * RichText — renders a string as HTML when it contains tags, or as plain text otherwise.
 * Sanitizes via DOMPurify. Supports a custom <tooltip> tag that renders as an interactive popover.
 */
export const RichText: React.FC<RichTextProps> = ({ content, className }) => {
  const theme = useTheme();

  const hasHtml = useMemo(() => containsHtml(content), [content]);

  const ref = React.useCallback(
    (node: HTMLSpanElement | null) => {
      if (!node || !hasHtml) return;

      // Hydrate <tooltip> elements into React components
      const tooltipElements = node.querySelectorAll('tooltip');
      tooltipElements.forEach((el) => {
        const title = el.getAttribute('title') || '';
        const text = el.textContent || '';

        // Create a wrapper span to mount React into
        const wrapper = document.createElement('span');
        el.replaceWith(wrapper);

        const root = createRoot(wrapper);
        root.render(
          <ThemeProvider theme={theme}>
            <Tooltip title={title}>{text}</Tooltip>
          </ThemeProvider>
        );
      });
    },
    [hasHtml, theme]
  );

  if (!hasHtml) {
    return <span className={className}>{content}</span>;
  }

  const sanitized = sanitize(content);

  return (
    <Wrapper
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};
