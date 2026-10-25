import { createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Where modal overlays render: on desktop, a layer inside the rounded content
 * card (App.tsx), so the service panel and the project modal open over the
 * page they belong to and leave the sidebar in view; on mobile, <body>.
 */
export const OverlayHostContext = createContext<HTMLElement | null>(null);

/**
 * Renders an overlay into the overlay host, outside the scrolling page.
 *
 * Overlays are `position: fixed`. The host is their containing block on
 * purpose (`contain: layout`); before, the card's backdrop-filter made it one
 * by accident, and when the page sections' entrance animation left a
 * transform behind, the section became the containing block instead: the
 * overlays grew as tall as the page, their sticky controls scrolled away,
 * and opening one further down showed its empty bottom. Outside the page
 * tree no section can do that again.
 */
const Portal = ({ children }: { children: ReactNode }) => {
  const host = useContext(OverlayHostContext);
  // The host ignores the pointer while empty; its overlays take it back.
  return createPortal(
    <div className="contents pointer-events-auto">{children}</div>,
    host ?? document.body,
  );
};

export default Portal;
