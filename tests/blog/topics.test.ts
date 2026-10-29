// @vitest-environment jsdom
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildBlog } from '../../scripts/build-blog.js';
import { topicPath } from '../../scripts/blog/templates/format.js';
import { renderTopicPage } from '../../scripts/blog/templates/topic.js';
import { TRANSLATION, makeDist, writePost } from './fixtures';

let root: string;
let contentDir: string;
let themeInitPath: string;

const write = (slug: string, body: string, extra = '', lang = 'en') =>
  writePost(contentDir, slug, body, extra, lang);
const doc = (dist: string, ...parts: string[]) =>
  new DOMParser().parseFromString(fs.readFileSync(path.join(dist, ...parts), 'utf8'), 'text/html');

/** An English post on `topic`; the fixture's default topic is testing. */
function onTopic(slug: string, topic: string, lang = 'en') {
  write(slug, 'Body\n', lang === 'en' ? '' : TRANSLATION, lang);
  const file = path.join(contentDir, slug, `${lang}.md`);
  fs.writeFileSync(
    file,
    fs.readFileSync(file, 'utf8').replace('topic: testing', `topic: ${topic}`),
  );
}

async function build() {
  const dist = makeDist(root, 'dist');
  const written = await buildBlog({ distDir: dist, contentDir, themeInitPath, launched: false });
  return { dist, written };
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-topics-'));
  contentDir = path.join(root, 'content');
  themeInitPath = path.join(root, 'theme-init.js');
  fs.writeFileSync(themeInitPath, 'document.documentElement.className = "js";\n');
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('topic pages', () => {
  it('lives under the blog of each language', () => {
    expect(topicPath('en', 'ai')).toBe('/blog/topic/ai');
    expect(topicPath('tr', 'testing')).toBe('/tr/blog/topic/testing');
  });

  it('writes a page only for topics that have posts in that language', async () => {
    onTopic('green', 'testing');
    onTopic('agents', 'ai');
    onTopic('green', 'testing', 'tr');
    const { written } = await build();
    expect(written.filter((file) => file.includes('/topic/'))).toEqual([
      'blog/topic/testing.html',
      'blog/topic/ai.html',
      'tr/blog/topic/testing.html',
    ]);
  });

  it('lists only that topic, with its own h1, and English posts marked on others', async () => {
    onTopic('green', 'testing');
    onTopic('agents', 'ai');
    onTopic('other-test', 'testing');
    onTopic('green', 'testing', 'tr');
    const { dist } = await build();
    const en = doc(dist, 'blog', 'topic', 'testing.html');
    expect(en.querySelector('h1')!.textContent).toBe('Testing');
    const links = [...en.querySelectorAll('.card-title a')].map((a) => a.getAttribute('href'));
    expect(links.sort()).toEqual(['/blog/green', '/blog/other-test']);
    const tr = doc(dist, 'tr', 'blog', 'topic', 'testing.html');
    expect(tr.querySelector('h1')!.textContent).toBe('Test');
    expect(tr.querySelector('a[href="/blog/other-test"]')!.closest('[lang="en"]')).not.toBeNull();
    expect(tr.querySelector('a[href="/blog/agents"]')).toBeNull();
  });

  it('is reachable from every card through its topic link', async () => {
    onTopic('green', 'testing');
    onTopic('green', 'testing', 'nl');
    const { dist } = await build();
    expect(doc(dist, 'nl', 'blog.html').querySelector('.topic-link')!.getAttribute('href')).toBe(
      '/nl/blog/topic/testing',
    );
  });

  it('keeps an English card’s topic link in the page’s language when that page exists', async () => {
    onTopic('green', 'testing');
    onTopic('green', 'testing', 'tr');
    onTopic('english-only', 'testing');
    onTopic('agents', 'ai');
    const { dist } = await build();
    const topicPage = doc(dist, 'tr', 'blog', 'topic', 'testing.html');
    const fallback = topicPage
      .querySelector('a[href="/blog/english-only"]')!
      .closest('li')!
      .querySelector('.topic-link')!;
    expect(fallback.getAttribute('href')).toBe('/tr/blog/topic/testing');
    expect(fallback.textContent).toBe('Test');
    expect(fallback.getAttribute('lang')).toBe('tr');
    expect(fallback.getAttribute('aria-current')).toBe('page');
    // No Turkish ai page: that card keeps its English topic link.
    const index = doc(dist, 'tr', 'blog.html');
    const agents = index.querySelector('a[href="/blog/agents"]')!.closest('li')!;
    expect(agents.querySelector('.topic-link')!.getAttribute('href')).toBe('/blog/topic/ai');
  });

  it('links each topic page to the same topic in the languages that have it', async () => {
    onTopic('green', 'testing');
    onTopic('green', 'testing', 'tr');
    onTopic('green', 'testing', 'nl');
    onTopic('agents', 'ai');
    onTopic('agents', 'ai', 'tr');
    const { dist } = await build();
    const alternates = (...parts: string[]) =>
      [...doc(dist, ...parts).querySelectorAll('link[rel="alternate"][hreflang]')].map(
        (link) => `${link.getAttribute('hreflang')} ${link.getAttribute('href')}`,
      );
    const site = 'https://emredursun.nl';
    expect(alternates('nl', 'blog', 'topic', 'testing.html')).toEqual([
      `en ${site}/blog/topic/testing`,
      `tr ${site}/tr/blog/topic/testing`,
      `nl ${site}/nl/blog/topic/testing`,
      `x-default ${site}/blog/topic/testing`,
    ]);
    expect(alternates('tr', 'blog', 'topic', 'ai.html')).toEqual([
      `en ${site}/blog/topic/ai`,
      `tr ${site}/tr/blog/topic/ai`,
      `x-default ${site}/blog/topic/ai`,
    ]);
  });

  it('describes itself as a collection inside the blog, with breadcrumbs', async () => {
    onTopic('agents', 'ai');
    const { dist } = await build();
    const ld = JSON.parse(
      doc(dist, 'blog', 'topic', 'ai.html').querySelector('script[type="application/ld+json"]')!
        .textContent!,
    );
    const [page, crumbs] = ld['@graph'];
    expect(page['@type']).toBe('CollectionPage');
    expect(page.hasPart).toEqual([{ '@id': 'https://emredursun.nl/blog/agents#article' }]);
    expect(crumbs.itemListElement.map((item: { item: string }) => item.item)).toEqual([
      'https://emredursun.nl/blog',
      'https://emredursun.nl/blog/topic/ai',
    ]);
  });

  it('preloads both faces, so its Bricolage h1 does not re-wrap when fonts load', async () => {
    onTopic('agents', 'ai');
    const { dist } = await build();
    const hrefs = [
      ...doc(dist, 'blog', 'topic', 'ai.html').querySelectorAll('link[rel="preload"][as="font"]'),
    ].map((link) => link.getAttribute('href'));
    expect(hrefs).toEqual([
      '/assets/newsreader-latin-400-normal-x1.woff2',
      '/assets/bricolage-grotesque-latin-wght-normal-y2.woff2',
    ]);
  });

  it('refuses to render an empty topic page', () => {
    expect(() =>
      renderTopicPage({
        topic: 'life',
        posts: [],
        assets: {} as never,
        launched: false,
        lang: 'en',
        languages: ['en'],
      }),
    ).toThrow(/life/);
  });
});
