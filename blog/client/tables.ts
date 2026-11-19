/**
 * A table that scrolls sideways needs a tab stop, so a keyboard reader can
 * scroll it; one that fits does not (an empty tab stop is noise). Posts render
 * the region without tabindex; this adds it while the table overflows and
 * takes it away when it stops (a rotated phone, a wider window).
 */
export function bindScrollableTables(doc: Document, win: Window): void {
  const regions = [...doc.querySelectorAll<HTMLElement>('.table-wrap')];
  if (regions.length === 0) return;
  const update = () => {
    for (const region of regions) {
      if (region.scrollWidth > region.clientWidth) region.setAttribute('tabindex', '0');
      else region.removeAttribute('tabindex');
    }
  };
  update();
  win.addEventListener('resize', update);
  // Web fonts change the widths once they arrive.
  void doc.fonts?.ready.then(update);
}
