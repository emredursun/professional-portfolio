import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  describeError,
  installGlobalErrorReporting,
  reportError,
  resetErrorReportingForTests,
} from '../src/utils/errorReporting.ts';

describe('describeError', () => {
  it('formats Error instances as "Name: message"', () => {
    expect(describeError(new TypeError('boom'))).toBe('TypeError: boom');
  });

  it('accepts thrown strings and non-Error values', () => {
    expect(describeError('plain failure')).toBe('plain failure');
    expect(describeError({ code: 42 })).toBe('Non-Error value thrown');
  });

  it('strips query strings and fragments so URLs cannot leak tokens', () => {
    const message = describeError(new Error('GET https://api.example.com/x?token=secret#frag failed'));
    expect(message).toBe('Error: GET https://api.example.com/x failed');
    expect(message).not.toContain('secret');
  });

  it('collapses whitespace and truncates to 120 characters', () => {
    const message = describeError(new Error(`a\n\n  ${'x'.repeat(300)}`));
    expect(message.startsWith('Error: a x')).toBe(true);
    expect(message).toHaveLength(120);
  });
});

describe('reportError', () => {
  const plausible = vi.fn();

  beforeEach(() => {
    resetErrorReportingForTests();
    plausible.mockReset();
    window.plausible = plausible;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    delete window.plausible;
  });

  it('sends a "JS Error" event with message and source props', () => {
    reportError(new Error('render failed'), 'render');
    expect(plausible).toHaveBeenCalledWith('JS Error', {
      props: { message: 'Error: render failed', source: 'render' },
    });
  });

  it('drops duplicates of the same message and source', () => {
    reportError(new Error('same'), 'window');
    reportError(new Error('same'), 'window');
    expect(plausible).toHaveBeenCalledTimes(1);
  });

  it('treats the same message from a different source as distinct', () => {
    reportError(new Error('same'), 'window');
    reportError(new Error('same'), 'promise');
    expect(plausible).toHaveBeenCalledTimes(2);
  });

  it('caps reports at five per page', () => {
    for (let i = 0; i < 10; i += 1) reportError(new Error(`error ${i}`), 'window');
    expect(plausible).toHaveBeenCalledTimes(5);
  });

  it('does not throw when Plausible is unavailable', () => {
    delete window.plausible;
    expect(() => reportError(new Error('no analytics'), 'window')).not.toThrow();
  });
});

describe('installGlobalErrorReporting', () => {
  const plausible = vi.fn();
  let uninstall: () => void;

  beforeEach(() => {
    resetErrorReportingForTests();
    plausible.mockReset();
    window.plausible = plausible;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    uninstall = installGlobalErrorReporting();
  });

  afterEach(() => {
    uninstall();
    delete window.plausible;
  });

  it('reports uncaught errors from window "error" events', () => {
    window.dispatchEvent(new ErrorEvent('error', { error: new Error('uncaught'), message: 'uncaught' }));
    expect(plausible).toHaveBeenCalledWith('JS Error', { props: { message: 'Error: uncaught', source: 'window' } });
  });

  it('ignores opaque cross-origin "Script error." events', () => {
    window.dispatchEvent(new ErrorEvent('error', { message: 'Script error.' }));
    expect(plausible).not.toHaveBeenCalled();
  });

  it('falls back to the event message when there is no error object', () => {
    window.dispatchEvent(new ErrorEvent('error', { message: 'ResizeObserver loop limit exceeded' }));
    expect(plausible).toHaveBeenCalledWith('JS Error', {
      props: { message: 'ResizeObserver loop limit exceeded', source: 'window' },
    });
  });

  it('reports unhandled promise rejections', () => {
    const event = new Event('unhandledrejection') as PromiseRejectionEvent;
    Object.defineProperty(event, 'reason', { value: new Error('rejected') });
    window.dispatchEvent(event);
    expect(plausible).toHaveBeenCalledWith('JS Error', { props: { message: 'Error: rejected', source: 'promise' } });
  });

  it('stops reporting after uninstall', () => {
    uninstall();
    // With no listener left, jsdom would surface the event as an uncaught
    // exception; this one only stands in for "the page handled it".
    window.addEventListener('error', (e) => e.preventDefault(), { once: true });
    window.dispatchEvent(new ErrorEvent('error', { error: new Error('late'), message: 'late' }));
    expect(plausible).not.toHaveBeenCalled();
    uninstall = () => {};
  });
});
