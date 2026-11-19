import { beforeEach, describe, expect, it } from 'vitest';
import { bindVideoEmbeds, vimeoPlayerUrl } from '../../blog/client/video';

function placeholder(id: string) {
  document.body.innerHTML = `<figure class="video-embed" data-video-id="${id}" data-video-title="The day">
<div class="video-frame"><p class="video-title">The day</p><button type="button" data-video-play>Play video</button></div>
</figure>`;
}

describe('vimeoPlayerUrl', () => {
  it('builds a do-not-track player URL for a numeric id', () => {
    expect(vimeoPlayerUrl('1248246223')).toBe(
      'https://player.vimeo.com/video/1248246223?dnt=1&autoplay=1',
    );
  });

  it.each(['', 'abc', '12/../evil', '1'.repeat(13)])('refuses %j', (id) => {
    expect(vimeoPlayerUrl(id)).toBeNull();
  });
});

describe('bindVideoEmbeds', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('adds no player until the button is pressed', () => {
    placeholder('42');
    bindVideoEmbeds(document);
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('swaps in the player on click and focuses it', () => {
    placeholder('42');
    bindVideoEmbeds(document);
    document.querySelector<HTMLButtonElement>('[data-video-play]')!.click();

    const frame = document.querySelector('iframe')!;
    expect(frame.src).toBe('https://player.vimeo.com/video/42?dnt=1&autoplay=1');
    expect(frame.title).toBe('The day');
    expect(frame.className).toBe('video-player');
    expect(document.querySelector('.video-frame')!.classList.contains('is-playing')).toBe(true);
    expect(document.querySelector('[data-video-play]')).toBeNull();
    expect(document.activeElement).toBe(frame);
  });

  it('leaves a placeholder with an invalid id alone', () => {
    placeholder('nope');
    bindVideoEmbeds(document);
    document.querySelector<HTMLButtonElement>('[data-video-play]')!.click();
    expect(document.querySelector('iframe')).toBeNull();
  });
});
