import React from 'react';

/**
 * Simple markdown parser for basic formatting without external dependencies
 * Supports: bold, italic, links, lists, headers, blockquotes, code blocks
 */

interface MarkdownNode {
  type: 'text' | 'bold' | 'italic' | 'link' | 'code' | 'linebreak';
  content: string;
  href?: string;
}

// Parse inline markdown elements
const parseInlineMarkdown = (text: string): MarkdownNode[] => {
  const nodes: MarkdownNode[] = [];
  let remaining = text;
  
  while (remaining.length > 0) {
    let matched = false;
    
    // Check for bold (**text** or __text__)
    const boldMatch = remaining.match(/^(\*\*|__)([^*_]+)\1/);
    if (boldMatch) {
      nodes.push({ type: 'bold', content: boldMatch[2] });
      remaining = remaining.slice(boldMatch[0].length);
      matched = true;
    }
    
    // Check for italic (*text* or _text_)
    if (!matched) {
      const italicMatch = remaining.match(/^(\*|_)([^*_]+)\1/);
      if (italicMatch) {
        nodes.push({ type: 'italic', content: italicMatch[2] });
        remaining = remaining.slice(italicMatch[0].length);
        matched = true;
      }
    }
    
    // Check for inline code (`code`)
    if (!matched) {
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        nodes.push({ type: 'code', content: codeMatch[1] });
        remaining = remaining.slice(codeMatch[0].length);
        matched = true;
      }
    }
    
    // Check for links [text](url)
    if (!matched) {
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        nodes.push({ type: 'link', content: linkMatch[1], href: linkMatch[2] });
        remaining = remaining.slice(linkMatch[0].length);
        matched = true;
      }
    }
    
    // If no match, take the next character as text
    if (!matched) {
      // Find the next special character
      const nextSpecial = remaining.search(/[\*_`\[]/);
      const textContent = nextSpecial === -1 ? remaining : remaining.slice(0, nextSpecial || 1);
      
      if (textContent) {
        nodes.push({ type: 'text', content: textContent });
        remaining = remaining.slice(textContent.length);
      } else {
        // Take just one character if nothing else matches
        nodes.push({ type: 'text', content: remaining[0] });
        remaining = remaining.slice(1);
      }
    }
  }
  
  return nodes;
};

// Render inline nodes
const renderInlineNodes = (nodes: MarkdownNode[]): React.ReactNode[] => {
  return nodes.map((node, index) => {
    switch (node.type) {
      case 'bold':
        return <strong key={index}>{node.content}</strong>;
      case 'italic':
        return <em key={index}>{node.content}</em>;
      case 'code':
        return (
          <code key={index} className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm">
            {node.content}
          </code>
        );
      case 'link':
        return (