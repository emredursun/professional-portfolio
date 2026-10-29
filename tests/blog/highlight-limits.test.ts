// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

const codeToHtml = vi.fn(() => '<pre></pre>');

vi.mock('shiki/core', () => ({
  createHighlighterCore: async () => ({ codeToHtml }),
}));

describe('createHighlight: determinism', () => {
  it('never lets Shiki give up on a slow line, so two builds always colour code the same', async () => {
    // Shiki stops tokenizing a line after 500 ms by default and prints it
    // plain. A cold regex engine on a slow machine can hit that on the first
    // line, which made one build differ from the next.
    const { createHighlight } = await import('../../scripts/blog/highlight.js');
    const { highlight } = await createHighlight();
    highlight('const a = 1;\n', 'ts');
    expect(codeToHtml).toHaveBeenCalledWith(
      'const a = 1;',
      expect.objectContaining({ tokenizeTimeLimit: 0 }),
    );
  });
});
