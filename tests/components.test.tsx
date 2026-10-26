import React from 'react';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from '../components/ErrorBoundary.tsx';
import Preloader, { shouldShowPreloader } from '../components/Preloader.tsx';
import { useIdleReady } from '../components/hooks/useIdleReady.tsx';

const mockReducedMotion = (reduce: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes('reduce'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
};

describe('shouldShowPreloader', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockReducedMotion(false);
  });

  it('plays once per session', () => {
    expect(shouldShowPreloader()).toBe(true);
    expect(sessionStorage.getItem('preloaderShown')).toBe('1');
    expect(shouldShowPreloader()).toBe(false);
  });

  it('never plays when the visitor prefers reduced motion', () => {
    mockReducedMotion(true);
    expect(shouldShowPreloader()).toBe(false);
    expect(sessionStorage.getItem('preloaderShown')).toBeNull();
  });

  it('still plays when sessionStorage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(shouldShowPreloader()).toBe(true);
  });
});

describe('Preloader', () => {
  it('mounts the page as the curtain lifts, then removes itself', async () => {
    const order: string[] = [];
    const { container } = render(
      <Preloader onReveal={() => order.push('reveal')} onComplete={() => order.push('complete')} />,
    );

    // Decorative: hidden from assistive tech, and no extra <h1> on the page.
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('h1')).toBeNull();
    expect(container.textContent).toContain('EMRE');

    await waitFor(() => expect(order).toEqual(['reveal', 'complete']), { timeout: 2000 });
  });
});

describe('ErrorBoundary', () => {
  const Boom: React.FC = () => {
    throw new Error('render exploded');
  };

  beforeEach(() => {
    // React logs caught render errors; keep the test output readable.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders its children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>content</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('content')).toBeTruthy();
  });

  it('replaces a crashed subtree with the fallback screen', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Oops! Something went wrong')).toBeTruthy();
  });

  it('uses a custom fallback when one is given', () => {
    render(
      <ErrorBoundary fallback={<p>custom fallback</p>}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText('custom fallback')).toBeTruthy();
  });

  it('does not take over the page for errors outside the React tree', () => {
    render(
      <ErrorBoundary>
        <p>still here</p>
      </ErrorBoundary>,
    );
    // Stands in for the page's own handling, so jsdom does not escalate the
    // event to an uncaught exception.
    window.addEventListener('error', (e) => e.preventDefault(), { once: true });
    act(() => {
      window.dispatchEvent(
        new ErrorEvent('error', { error: new Error('third-party'), message: 'third-party' }),
      );
    });
    expect(screen.getByText('still here')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('useIdleReady', () => {
  afterEach(() => {
    vi.useRealTimers();
    delete (window as { requestIdleCallback?: unknown }).requestIdleCallback;
    delete (window as { cancelIdleCallback?: unknown }).cancelIdleCallback;
  });

  it('becomes ready on the first idle callback', () => {
    let fire: () => void = () => {};
    Object.assign(window, {
      requestIdleCallback: vi.fn((cb: () => void) => {
        fire = cb;
        return 7;
      }),
      cancelIdleCallback: vi.fn(),
    });
    const { result } = renderHook(() => useIdleReady());
    expect(result.current).toBe(false);
    act(() => fire());
    expect(result.current).toBe(true);
  });

  it('cancels the idle callback on unmount', () => {
    const cancel = vi.fn();
    Object.assign(window, { requestIdleCallback: vi.fn(() => 7), cancelIdleCallback: cancel });
    const { unmount } = renderHook(() => useIdleReady());
    unmount();
    expect(cancel).toHaveBeenCalledWith(7);
  });

  it('clears the fallback timer on unmount', () => {
    // Fake only the timer fallback; Vitest 5 would otherwise also fake
    // requestIdleCallback and the hook would take the other branch.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { unmount } = renderHook(() => useIdleReady());
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('falls back to a timer where requestIdleCallback is missing', () => {
    // Fake only the timer fallback; Vitest 5 would otherwise also fake
    // requestIdleCallback and the hook would take the other branch.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { result } = renderHook(() => useIdleReady(5000));
    expect(result.current).toBe(false);
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(result.current).toBe(true);
  });
});

describe('bootstrap', () => {
  it('registers the service worker after load in production builds only', async () => {
    const register = vi.fn().mockResolvedValue({});
    Object.defineProperty(navigator, 'serviceWorker', { value: { register }, configurable: true });

    vi.resetModules();
    await import('../src/bootstrap.ts');
    window.dispatchEvent(new Event('load'));
    expect(register).not.toHaveBeenCalled();

    vi.stubEnv('PROD', true);
    vi.resetModules();
    await import('../src/bootstrap.ts');
    window.dispatchEvent(new Event('load'));
    expect(register).toHaveBeenCalledWith('/sw.js');
    vi.unstubAllEnvs();
  });

  it('reloads once when a lazy chunk from a previous deploy is gone, never in a loop', async () => {
    const { handleStaleChunk } = await import('../src/bootstrap.ts');
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    };
    const reload = vi.fn();

    const first = new Event('vite:preloadError', { cancelable: true });
    handleStaleChunk(first, storage, reload);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(first.defaultPrevented).toBe(true);

    // Still failing after the reload: leave it to the error boundary.
    const second = new Event('vite:preloadError', { cancelable: true });
    handleStaleChunk(second, storage, reload);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(second.defaultPrevented).toBe(false);
  });

  it('does not reload when session storage is blocked', async () => {
    const { handleStaleChunk } = await import('../src/bootstrap.ts');
    const blocked = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => undefined,
    };
    const reload = vi.fn();
    handleStaleChunk(new Event('vite:preloadError', { cancelable: true }), blocked, reload);
    expect(reload).not.toHaveBeenCalled();
  });
});
