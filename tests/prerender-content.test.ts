// @vitest-environment node
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { END, START, injectContent, titleOf } from '../scripts/prerender-content.js';

describe('injectContent', () => {
  const page = `<body><div id="root">${START}<div data-testid="preloader"></div>${END}</div><script></script></body>`;

  it('puts both layouts between the markers, in place of the intro curtain', () => {
    const html = injectContent(page, {
      desktop: '<main>wide</main>',
      mobile: '<main>narrow</main>',
    });
    expect(html).toBe(
      `<body><div id="root">${START}<div class="prerender-desktop"><main>wide</main></div>` +
        `<div class="prerender-mobile"><main>narrow</main></div>${END}</div><script></script></body>`,
    );
  });

  it('keeps the curtain for phones when there is no phone snapshot', () => {
    expect(injectContent(page, { desktop: '<main>wide</main>' })).toBe(
      `<body><div id="root">${START}<div class="prerender-desktop"><main>wide</main></div>` +
        `<div class="prerender-mobile"><div data-testid="preloader"></div></div>${END}</div><script></script></body>`,
    );
  });

  it('fails on a page without the markers', () => {
    expect(() => injectContent('<div id="root"></div>', { desktop: '', mobile: '' })).toThrow(
      /markers/,
    );
  });

  it('finds the markers in the app template, around the static curtain', () => {
    const template = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
    const root = template.slice(template.indexOf('<div id="root">'));
    expect(root.startsWith(`<div id="root">${START}<div data-testid="preloader"`)).toBe(true);
    expect(root).toContain(`${END}</div>`);
  });
});

describe('titleOf', () => {
  it('reads the title as the app sets it, with entities decoded', () => {
    expect(titleOf('<head><title>Pega &amp; Tosca | Emre Dursun</title></head>')).toBe(
      'Pega & Tosca | Emre Dursun',
    );
  });

  it('fails on a page without a title', () => {
    expect(() => titleOf('<head></head>')).toThrow(/title/);
  });
});
