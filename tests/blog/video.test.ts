// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../../scripts/blog/markdown.js';
import { renderVideo } from '../../scripts/blog/video.js';

const FILE = 'blog/content/sample/en.md';
const BLOCK = ['id: 123456', 'title: A <b>day</b> out', 'credit: Example & Co'].join('\n');

describe('renderVideo', () => {
  it('renders a click-to-load placeholder and never the player', () => {
    const html = renderVideo(BLOCK, { file: FILE, lang: 'en' });
    expect(html).toContain('data-video-id="123456"');
    expect(html).toContain('<button type="button" class="video-play" data-video-play');
    expect(html).toContain('href="https://vimeo.com/123456" rel="noopener noreferrer"');
    expect(html).toContain('Watch on Vimeo');
    expect(html).not.toMatch(/<iframe|player\.vimeo\.com|vimeocdn/);
  });

  it('escapes the title and credit', () => {
    const html = renderVideo(BLOCK, { file: FILE, lang: 'en' });
    expect(html).toContain('A &lt;b&gt;day&lt;/b&gt; out');
    expect(html).toContain('Example &amp; Co');
    expect(html).not.toContain('<b>');
  });

  it('uses the post language for its words and marks a title in another language', () => {
    const html = renderVideo(`${BLOCK}\ntitleLang: en`, { file: FILE, lang: 'nl' });
    expect(html).toContain('Bekijk op Vimeo');
    expect(html).toContain('<p class="video-title" lang="en">');
    const same = renderVideo(`${BLOCK}\ntitleLang: en`, { file: FILE, lang: 'en' });
    expect(same).toContain('<p class="video-title">');
  });

  it.each([
    ['id: 12a\ntitle: t\ncredit: c', /must be the video's number/],
    ['title: t\ncredit: c', /needs id/],
    ['id: 1\ntitle: t\ncredit: c\nsrc: https://evil.example', /is not one of/],
    ['id: 1\ntitle: t\ncredit: c\ntitleLang: english', /not a language code/],
  ])('fails the build for a bad block: %s', (body, message) => {
    expect(() => renderVideo(body, { file: FILE, lang: 'en' })).toThrow(message);
  });
});

describe('renderMarkdown: vimeo blocks', () => {
  const source = `Intro\n\n\`\`\`vimeo\n${BLOCK}\n\`\`\`\n`;

  it('renders the embed and does not count it as code', () => {
    const { html, hasCode } = renderMarkdown(source, { file: FILE, lang: 'tr' });
    expect(html).toContain('class="video-embed"');
    expect(html).toContain('Vimeo’da izleyin');
    expect(hasCode).toBe(false);
  });

  it('needs the post language', () => {
    expect(() => renderMarkdown(source, { file: FILE })).toThrow(/needs the post's language/);
  });
});
