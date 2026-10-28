// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { renderMarkdown } from '../../scripts/blog/markdown.js';

const FILE = 'blog/content/sample/en.md';
const render = (source: string, options = {}) => renderMarkdown(source, { file: FILE, ...options });

describe('renderMarkdown: raw HTML', () => {
  it('prints script tags as text', () => {
    const { html } = render('Hi <script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script');
  });

  it('prints event-handler attributes and HTML blocks as text', () => {
    const { html } = render('<img src=x onerror="alert(1)">\n\n<div>block</div>');
    expect(html).not.toMatch(/<img|<div/);
    expect(html).toContain('&lt;div&gt;block&lt;/div&gt;');
  });
});

describe('renderMarkdown: links', () => {
  it.each([
    '[x](javascript:alert(1))',
    '[x](JaVaScRiPt:alert(1))',
    '[x](java&#x09;script:alert(1))',
    '[x](java%0Ascript:alert(1))',
    '[x](vbscript:msgbox)',
    '[x](data:text/html,hi)',
    '[x](file:///etc/passwd)',
    '[x](//evil.example)',
    '[x](/\\evil.example)',
    '[x][ref]\n\n[ref]: javascript:alert(1)',
  ])('fails the build for %s', (source) => {
    expect(() => render(source)).toThrow(/sample\/en\.md.*link/);
  });

  it.each([
    ['[x](https://example.com)', 'https://example.com'],
    ['[x](http://example.com)', 'http://example.com'],
    ['[x](mailto:hi@example.com)', 'mailto:hi@example.com'],
    ['[x](/about)', '/about'],
    ['[x](#section)', '#section'],
    ['[x](../other-post)', '../other-post'],
  ])('allows %s', (source, href) => {
    expect(render(source).html).toContain(`href="${href}"`);
  });

  it('marks external links with rel and never opens a new tab', () => {
    const { html } = render('[x](https://example.com/page)');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toContain('target=');
  });

  it('leaves links to this site and relative links without rel', () => {
    const { html } = render('[a](https://emredursun.nl/about) [b](/projects)');
    expect(html).not.toContain('rel=');
  });
});

describe('renderMarkdown: images', () => {
  it('fails for images hosted elsewhere, which the CSP would block', () => {
    expect(() => render('![chart](https://cdn.example/chart.png)')).toThrow(/image/);
  });

  it('fails for an image without alternative text', () => {
    expect(() => render('![](/images/chart.png)')).toThrow(/alt/);
  });

  it('accepts a local image with alt text', () => {
    expect(render('![A chart](/images/chart.png)').html).toContain('alt="A chart"');
  });
});

describe('renderMarkdown: headings', () => {
  it('gives h2 and h3 stable ids and builds the table of contents', () => {
    const { html, toc } = render('## First part\n\n### A detail\n\n## Second part\n');
    expect(html).toContain('<h2 id="first-part">');
    expect(html).toContain('<h3 id="a-detail">');
    expect(toc).toEqual([
      { level: 2, id: 'first-part', text: 'First part' },
      { level: 3, id: 'a-detail', text: 'A detail' },
      { level: 2, id: 'second-part', text: 'Second part' },
    ]);
  });

  it('de-duplicates repeated headings', () => {
    const { toc } = render('## Notes\n\n## Notes\n\n## Notes\n');
    expect(toc.map((entry) => entry.id)).toEqual(['notes', 'notes-2', 'notes-3']);
  });

  it('makes ids from Turkish and accented text', () => {
    const { toc } = render('## Çalışma ışığı ve öğrenme\n');
    expect(toc[0].id).toBe('calisma-isigi-ve-ogrenme');
  });

  it('escapes heading text in the TOC data and the HTML', () => {
    const { html, toc } = render('## Use `<b>` & go\n');
    expect(toc[0].text).toBe('Use <b> & go');
    expect(html).toContain('&lt;b&gt;');
  });

  it('rejects an h1 in the body; the page title is the only h1', () => {
    expect(() => render('# Title\n')).toThrow(/h1/);
  });

  it('rejects skipped levels', () => {
    expect(() => render('## Part\n\n#### Too deep\n')).toThrow(/h4/);
    expect(() => render('### Starts too deep\n')).toThrow(/h3/);
  });
});

describe('renderMarkdown: code', () => {
  it('passes fenced code and its language to the highlighter', () => {
    const highlight = vi.fn(
      (code: string, lang: string) => `<pre data-lang="${lang}">${code}</pre>`,
    );
    const { html, hasCode } = render('```ts\nconst a = 1;\n```\n', { highlight });
    expect(highlight).toHaveBeenCalledWith('const a = 1;\n', 'ts');
    expect(html).toContain('data-lang="ts"');
    expect(hasCode).toBe(true);
  });

  it('treats a fence without a language as plain text', () => {
    const highlight = vi.fn(() => '<pre></pre>');
    render('```\nplain\n```\n', { highlight });
    expect(highlight).toHaveBeenCalledWith('plain\n', 'text');
  });

  it('escapes code when no highlighter is given', () => {
    const { html } = render('```\n<b>x</b>\n```\n');
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
  });

  it('rejects languages the highlighter does not load', () => {
    expect(() => render('```python\nprint(1)\n```\n')).toThrow(/python/);
  });

  it('reports no code for a post without fences', () => {
    expect(render('Just text.').hasCode).toBe(false);
  });
});
