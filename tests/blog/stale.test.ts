// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { markStaleEvidence } from '../../blog/client/stale.ts';

function card(recheckBy: string) {
  document.body.innerHTML = `<aside class="evidence" data-recheck-by="${recheckBy}"><p class="stale-note" hidden>Needs a re-run</p></aside>`;
  return document.querySelector('.evidence')!;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('markStaleEvidence', () => {
  it('shows the note once the re-check date has passed', () => {
    const aside = card('2027-10-01');
    markStaleEvidence(document, new Date('2027-10-02T08:00:00Z'));
    expect(aside.classList.contains('is-stale')).toBe(true);
    expect(aside.querySelector('.stale-note')!.hasAttribute('hidden')).toBe(false);
  });

  it('leaves the note hidden on and before the re-check date', () => {
    const aside = card('2027-10-01');
    markStaleEvidence(document, new Date('2027-10-01T23:00:00Z'));
    expect(aside.classList.contains('is-stale')).toBe(false);
    expect(aside.querySelector('.stale-note')!.hasAttribute('hidden')).toBe(true);
  });

  it('ignores a malformed date instead of guessing', () => {
    const aside = card('soon');
    markStaleEvidence(document, new Date('2030-01-01T00:00:00Z'));
    expect(aside.classList.contains('is-stale')).toBe(false);
  });
});
