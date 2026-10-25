import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders a modal overlay at the end of <body>, outside every page container.
 *
 * Overlays are `position: fixed` to the viewport, but a transform, filter or
 * contain on any ancestor turns that ancestor into their containing block.
 * The page sections' entrance animation once did exactly that: the service
 * panel and the project modal grew as tall as the page, their sticky
 * controls scrolled away, and opening them further down the page showed
 * their empty bottom. Outside the page tree no ancestor can do that again.
 * The theme stays: the `dark` class is on <html>.
 */
const Portal = ({ children }: { children: ReactNode }) => createPortal(children, document.body);

export default Portal;
