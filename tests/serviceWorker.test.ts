import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8');
const ORIGIN = 'https://emredursun.nl';

/** Runs public/sw.js in a sandbox and returns the event listeners it registers. */
function loadWorker(cacheNames: string[] = []) {
  const listeners: Record<string, (event: unknown) => void> = {};
  const deleted: string[] = [];
  const caches = {
    keys: async () => cacheNames,
    delete: async (name: string) => {
      deleted.push(name);
      return true;
    },
    open: async () => ({ addAll: async () => {}, put: async () => {} }),
    match: async () => undefined,
  };
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type: string, fn: (event: unknown) => void) => {
      listeners[type] = fn;
    },
    skipWaiting: () => Promise.resolve(),
    clients: { claim: () => Promise.resolve() },
  };
  const fetch = vi.fn(async () => new Response('', { status: 404 }));
  runInNewContext(source, { self, caches, URL, fetch, Response, console });
  return { listeners, deleted };
}

function fetchEvent(url: string) {
  return { request: { url, method: 'GET' }, respondWith: vi.fn() };
}

describe('service worker', () => {
  it('handles requests to its own origin', () => {
    const { listeners } = loadWorker();
    const event = fetchEvent(`${ORIGIN}/assets/main.js`);
    listeners.fetch(event);
    expect(event.respondWith).toHaveBeenCalled();
  });

  it('leaves other origins alone, including look-alikes that contain its own', () => {
    const { listeners } = loadWorker();
    for (const url of ['https://plausible.io/js/script.js', `${ORIGIN}.evil.example/assets/x.js`]) {
      const event = fetchEvent(url);
      listeners.fetch(event);
      expect(event.respondWith, url).not.toHaveBeenCalled();
    }
  });

  it('on activate deletes only its own old caches', async () => {
    // The current cache, read from the worker so a version bump needs no edit here.
    const current = `ed-portfolio-${source.match(/CACHE_PREFIX\}(v\d+)/)?.[1]}`;
    expect(current).toMatch(/^ed-portfolio-v\d+$/);
    const { listeners, deleted } = loadWorker(['ed-portfolio-v1', current, 'other-app-cache']);
    let done: Promise<unknown> = Promise.resolve();
    listeners.activate({ waitUntil: (p: Promise<unknown>) => (done = p) });
    await done;
    expect(deleted).toEqual(['ed-portfolio-v1']);
  });
});
