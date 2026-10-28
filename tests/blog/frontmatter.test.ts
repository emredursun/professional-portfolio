// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { parseFrontmatter } from '../../scripts/blog/frontmatter.js';

const FILE = 'blog/content/sample/en.md';

describe('parseFrontmatter', () => {
  it('splits YAML data from the Markdown body', () => {
    const { data, body } = parseFrontmatter('---\ntitle: Hello\n---\n# Body\n\nText\n', FILE);
    expect(data).toEqual({ title: 'Hello' });
    expect(body).toBe('# Body\n\nText\n');
  });

  it('accepts a byte order mark and Windows line endings', () => {
    const bom = String.fromCharCode(0xfeff);
    const { data, body } = parseFrontmatter(`${bom}---\r\ntitle: Hi\r\n---\r\nText\r\n`, FILE);
    expect(data).toEqual({ title: 'Hi' });
    expect(body).toBe('Text\n');
  });

  it('keeps dates as strings, so the build never depends on time zones', () => {
    const { data } = parseFrontmatter('---\npublishedAt: 2026-10-28\n---\n', FILE);
    expect(data.publishedAt).toBe('2026-10-28');
  });

  it('names the file when the opening fence is missing', () => {
    expect(() => parseFrontmatter('title: Hi\n---\n', FILE)).toThrow(/sample\/en\.md/);
  });

  it('rejects an unclosed block', () => {
    expect(() => parseFrontmatter('---\ntitle: Hi\n', FILE)).toThrow(/closing ---/);
  });

  it.each(['---js', '---javascript', '---json', '--- js'])(
    'rejects the executable or alternative opener %s',
    (opener) => {
      expect(() => parseFrontmatter(`${opener}\n{ title: 'x' }\n---\n`, FILE)).toThrow(
        /must start with a line containing only ---/,
      );
    },
  );

  it('rejects anchors and aliases', () => {
    const source = '---\na: &x [1, 2]\nb: *x\n---\n';
    expect(() => parseFrontmatter(source, FILE)).toThrow(/aliases/);
  });

  it('rejects duplicate keys', () => {
    expect(() => parseFrontmatter('---\ntitle: a\ntitle: b\n---\n', FILE)).toThrow();
  });

  it('rejects custom tags such as !!js/function', () => {
    const source = "---\nrun: !!js/function 'function () { return 1 }'\n---\n";
    expect(() => parseFrontmatter(source, FILE)).toThrow();
  });

  it('requires a mapping, not a list or a scalar', () => {
    expect(() => parseFrontmatter('---\n- a\n- b\n---\n', FILE)).toThrow(/key: value/);
    expect(() => parseFrontmatter('---\njust text\n---\n', FILE)).toThrow(/key: value/);
  });

  it('returns the body unchanged, including a later --- rule', () => {
    const { body } = parseFrontmatter('---\ntitle: a\n---\nOne\n\n---\n\nTwo\n', FILE);
    expect(body).toBe('One\n\n---\n\nTwo\n');
  });
});
