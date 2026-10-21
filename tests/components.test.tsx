import React from 'react';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import gsap from 'gsap';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from '../components/ErrorBoundary.tsx';
import Preloader, { shouldShowPreloader } from '../components/Preloader.tsx';
import { useIdleReady } from '../components/hooks/useIdleReady.tsx';
import { resetErrorReportingForTests } from '../src/utils/errorReporting.ts';

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
  afterEach(() => {
    gsap.globalTimeline.timeScale(1);
  });

  it('mounts the page as the curtain lifts, then removes itself', async () => {
    gsap.globalTimeline.timeScale(20);
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
    resetErrorReportingForTests();
    // React logs caught render errors; keep the test output readable.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    delete window.plausible;
  });

  it('renders its children when nothing throws', () => {
    render(<ErrorBoundary><p>content</p></ErrorBoundary>);
    expect(screen.getByText('content')).toBeTruthy();
  });

  it('replaces a crashed subtree with the fallback screen and reports it', () => {
    const plausible = vi.fn();
    window.plausible = plausible;
    render(<ErrorBoundary><Boom /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Oops! Something went wrong')).toBeTruthy();
    expect(plausible).toHaveBeenCalledWith('JS Error', {
      props: { message: 'Error: render exploded', source: 'render' },
    });
  });

  it('uses a custom fallback when one is given', () => {
    render(<ErrorBoundary fallback={<p>custom fallback</p>}><Boom /></ErrorBoundary>);
    expect(screen.getByText('custom fallback')).toBeTruthy();
  });

  it('does not take over the page for errors outside the React tree', () => {
    render(<ErrorBoundary><p>still here</p></ErrorBoundary>);
    // Stands in for the page's own handling, so jsdom does not escalate the
    // event to an uncaught exception.
    window.addEventListener('error', (e) => e.preventDefault(), { once: true });
    act(() => {
      window.dispatchEvent(new ErrorEvent('error', { error: new Error('third-party'), message: 'third-party' }));
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

  it('falls back to a timer where requestIdleCallback is missing', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useIdleReady(5000));
    expect(result.current).toBe(false);
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(result.current).toBe(true);
  });
});

describe('bootstrap', () => {
  it('installs a Plausible queue that buffers calls until the script loads', async () => {
    delete window.plausible;
    vi.resetModules();
    await import('../src/bootstrap.ts');
    // Read through a fresh reference: after `delete` TypeScript narrows
    // window.plausible to undefined, unaware the import reassigned it.
    const plausible = (window as Window).plausible;
    plausible?.('form_start');
    plausible?.('form_submit', { props: { duration: 3 } });
    expect(plausible?.q).toEqual([['form_start'], ['form_submit', { props: { duration: 3 } }]]);
  });

  it('keeps an already-loaded Plausible instead of replacing it', async () => {
    const real = vi.fn();
    window.plausible = real;
    vi.resetModules();
    await import('../src/bootstrap.ts');
    expect(window.plausible).toBe(real);
  });
});
