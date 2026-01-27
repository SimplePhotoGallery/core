import { marked } from 'marked';

// Configure marked to only allow specific formatting options
const renderer = new marked.Renderer();

// Disable headings by rendering them as paragraphs
renderer.heading = ({ text }: { text: string }) => {
  return '<p>' + text + '</p>\n';
};

// Disable images
renderer.image = () => '';

// Disable HTML
renderer.html = () => '';

// Disable tables
renderer.table = () => '';
renderer.tablerow = () => '';
renderer.tablecell = () => '';

// Configure marked options
marked.use({
  renderer: renderer,
  breaks: true,
  gfm: true,
});

/**
 * Renders markdown with limited formatting options.
 * Supported: paragraphs, bold, italic, lists, code blocks, blockquotes, links
 * Disabled: headings (rendered as paragraphs), images, HTML, tables
 */
export async function renderMarkdown(markdown: string): Promise<string> {
  if (!markdown) return '';
  return await marked.parse(markdown);
}
