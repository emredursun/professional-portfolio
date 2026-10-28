/**
 * Marks an evidence card whose re-check date has passed ("needs a re-run").
 *
 * Done in the browser on purpose: the build must not read the clock, or two
 * builds of the same content would differ. The page carries the date
 * (data-recheck-by) and a hidden note; this reveals the note when it is due.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function markStaleEvidence(doc: Document, now: Date): void {
  const today = now.toISOString().slice(0, 10);
  doc.querySelectorAll<HTMLElement>('[data-recheck-by]').forEach((card) => {
    const due = card.dataset.recheckBy ?? '';
    if (!ISO_DATE.test(due) || today <= due) return;
    card.classList.add('is-stale');
    card.querySelector<HTMLElement>('.stale-note')?.removeAttribute('hidden');
  });
}
