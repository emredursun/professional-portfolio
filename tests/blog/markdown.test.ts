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

  const chart = { src: '/assets/blog-img-sample-chart-0a1b2c3d.svg', width: 640, height: 320 };
  const image = (name: string) => (name === 'chart.svg' ? chart : undefined);

  it('fails for an image without alternative text', () => {
    expect(() => render('![](chart.svg)', { image })).toThrow(/alt/);
  });

  it('serves an image next to the post at its hashed URL, sized and lazy', () => {
    expect(render('![A chart](chart.svg)', { image }).html).toContain(
      `<img src="${chart.src}" alt="A chart" width="640" height="320" loading="lazy" decoding="async">`,
    );
  });

  it.each(['/images/chart.png', 'images/chart.svg', '../other/chart.svg'])(
    'fails for %s, which is not a file next to the post',
    (src) => {
      expect(() => render(`![A chart](${src})`, { image })).toThrow(/next to the post/);
    },
  );

  it('fails for an image file that does not exist', () => {
    expect(() => render('![A chart](missing.svg)', { image })).toThrow(/missing\.svg.*not found/);
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

describe('renderMarkdown: review findings', () => {
  it.each([
    '![a](http:cdn.example/x.png)',
    '![a](HTTP:cdn.example/x.png)',
    '![a](http:/cdn.example/x.png)',
  ])('treats the scheme-only image %s as external and fails', (source) => {
    expect(() => render(source)).toThrow(/served from this site/);
  });

  it('treats https: without slashes as this site, and still wants the file next to the post', () => {
    // On an https page, "https:/x" and "https:x" are relative, like "/x" and "x".
    expect(() => render('![a](https:/images/x.png)')).toThrow(/next to the post/);
  });

  it('marks a scheme-only external link with rel', () => {
    expect(render('[a](http:evil.example/x)').html).toContain('rel="noopener noreferrer"');
  });

  it('names the file when a link is not a valid URL', () => {
    expect(() => render('[a](http://[x)')).toThrow(/sample\/en\.md.*not a valid URL/);
  });

  it('fails closed on malformed percent-encoding', () => {
    expect(() => render('[a](java%09script:alert(1)%E0)')).toThrow(/percent-encoding/);
  });

  it('never repeats a heading id, even when a heading looks like a suffix', () => {
    const { toc } = render('## Notes\n\n## Notes\n\n## Notes 2\n');
    const ids = toc.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps clear of the ids the page template uses', () => {
    const { toc } = render('## Main\n\n## Evidence title\n');
    expect(toc.map((entry) => entry.id)).toEqual(['main-2', 'evidence-title-2']);
  });

  it('folds letters that have no accent to strip', () => {
    const { toc } = render('## Straße, Æble, Øl, Łódź\n');
    expect(toc[0].id).toBe('strasse-aeble-ol-lodz');
  });

  it('rejects indented code blocks, which would skip highlighting and focus', () => {
    expect(() => render('Text\n\n    indented code\n')).toThrow(/fenced block/);
  });
});
