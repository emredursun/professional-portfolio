import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SEO from '../components/SEO';

/**
 * Until the locale files load, t() answers with the key itself. SEO must not
 * write "meta.title" over the prerendered head in that window.
 */
const i18n = vi.hoisted(() => ({ ready: false, strings: {} as Record<string, string> }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => (i18n.ready ? (i18n.strings[key] ?? key) : key),
    ready: i18n.ready,
  }),
}));

const PRERENDERED = 'Resume: QA Consultant, Pega, Tricentis Tosca | Emre Dursun';

function renderAt(pathname: string, props: React.ComponentProps<typeof SEO>) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <SEO {...props} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  document.head.innerHTML = `<meta name="description" content="Prerendered description." />`;
  document.title = PRERENDERED;
});

describe('SEO', () => {
  it('keeps the prerendered head while translations are loading', () => {
    i18n.ready = false;
    renderAt('/resume', { title: 'meta.title', description: 'meta.description' });
    expect(document.title).toBe(PRERENDERED);
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Prerendered description.',
    );
  });

  it('writes the translated head once they have loaded', () => {
    i18n.ready = true;
    i18n.strings = {
      'meta.title': 'Emre Dursun – QA Consultant: Pega, Tricentis Tosca, Playwright',
    };
    renderAt('/nl/resume', { title: 'CV: QA Consultant', description: 'Een beschrijving.' });
    expect(document.title).toBe('CV: QA Consultant | Emre Dursun');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://emredursun.nl/nl/resume',
    );

    renderAt('/about', {});
    expect(document.title).toBe('Emre Dursun – QA Consultant: Pega, Tricentis Tosca, Playwright');
  });
});
