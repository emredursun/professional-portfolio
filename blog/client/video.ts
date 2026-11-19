/**
 * Click-to-load video embeds (scripts/blog/video.js renders the placeholder).
 *
 * Until the visitor presses play, the page makes no request to the video
 * host. The click swaps the placeholder for the player, with dnt=1 so Vimeo
 * does not track the session, and moves focus to it so keyboard users land
 * where the video is.
 */

const VIMEO_ID = /^\d{1,12}$/;

/** The player URL for a Vimeo video, or null when the id is not a plain number. */
export function vimeoPlayerUrl(id: string): string | null {
  return VIMEO_ID.test(id) ? `https://player.vimeo.com/video/${id}?dnt=1&autoplay=1` : null;
}

function createPlayer(doc: Document, src: string, title: string): HTMLIFrameElement {
  const frame = doc.createElement('iframe');
  frame.src = src;
  frame.title = title;
  frame.allow = 'autoplay; fullscreen; picture-in-picture';
  frame.allowFullscreen = true;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.className = 'video-player';
  return frame;
}

export function bindVideoEmbeds(doc: Document): void {
  doc.querySelectorAll<HTMLElement>('.video-embed').forEach((figure) => {
    const button = figure.querySelector<HTMLButtonElement>('[data-video-play]');
    const holder = figure.querySelector<HTMLElement>('.video-frame');
    const src = vimeoPlayerUrl(figure.dataset.videoId ?? '');
    if (!button || !holder || !src) return;
    button.addEventListener(
      'click',
      () => {
        const player = createPlayer(doc, src, figure.dataset.videoTitle ?? '');
        holder.replaceChildren(player);
        holder.classList.add('is-playing');
        player.focus();
      },
      { once: true },
    );
  });
}
