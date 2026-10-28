// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { statusChip } from '../../scripts/blog/templates/status.js';

const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html');

describe('statusChip', () => {
  it.each([
    ['hypothesis', 'Hypothesis'],
    ['testing', 'Testing'],
    ['verified', 'Verified'],
    ['revised', 'Revised'],
  ])('shows the %s icon next to its label', (status, label) => {
    const doc = parse(String(statusChip(status)));
    const chip = doc.querySelector(`.status.status-${status}`)!;
    expect(chip.textContent).toBe(label);
    const icon = chip.querySelector(`svg.status-icon-${status}`)!;
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.getAttribute('focusable')).toBe('false');
  });

  it('draws the icons without inline styles', () => {
    for (const status of ['hypothesis', 'testing', 'verified', 'revised']) {
      expect(String(statusChip(status))).not.toMatch(/\sstyle=/);
    }
  });

  it('refuses a status it does not know', () => {
    expect(() => statusChip('done')).toThrow(/done/);
  });
});
