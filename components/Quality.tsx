import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SEO from './SEO.tsx';

/** Shape of dist/quality.json, written by scripts/write-quality.js in CI. */
interface QualityReport {
  shortCommit: string;
  builtAt: string;
  unit: { passed: number; failed: number; coverage: number };
  e2e: { passed: number; failed: number; flaky: number; skipped: number };
  a11y: { scans: number; violations: number };
  lighthouse: { performance: number; accessibility: number; bestPractices: number; seo: number };
  security: { runtimeAdvisories: number; strictCsp: boolean };
}

type LoadState =
  { status: 'loading' } | { status: 'ready'; report: QualityReport } | { status: 'unavailable' };

const isCount = (value: unknown) => typeof value === 'number' && Number.isFinite(value);

/**
 * Accept only a complete report: every number the page renders, and a date
 * Intl can format. A partial one would render "undefined passed" or throw.
 */
function isQualityReport(data: unknown): data is QualityReport {
  const r = data as Partial<QualityReport> | null;
  return Boolean(
    r &&
    typeof r.shortCommit === 'string' &&
    typeof r.builtAt === 'string' &&
    !Number.isNaN(Date.parse(r.builtAt)) &&
    [r.unit?.passed, r.unit?.failed, r.unit?.coverage].every(isCount) &&
    [r.e2e?.passed, r.e2e?.failed, r.e2e?.flaky].every(isCount) &&
    isCount(r.a11y?.violations) &&
    [r.lighthouse?.performance, r.lighthouse?.accessibility, r.lighthouse?.seo].every(isCount) &&
    isCount(r.security?.runtimeAdvisories) &&
    typeof r.security?.strictCsp === 'boolean',
  );
}

/** One terminal line per gate, with the rule that decides its tick. */
const LINES = [
  {
    id: 'unit',
    ok: (r: QualityReport) => r.unit.failed === 0,
    values: (r: QualityReport) => ({ passed: r.unit.passed, coverage: r.unit.coverage }),
  },
  {
    id: 'e2e',
    ok: (r: QualityReport) => r.e2e.failed === 0,
    values: (r: QualityReport) => ({ passed: r.e2e.passed }),
  },
  {
    id: 'a11y',
    ok: (r: QualityReport) => r.a11y.violations === 0,
    values: (r: QualityReport) => ({ violations: r.a11y.violations }),
  },
  {
    id: 'lighthouse',
    ok: (r: QualityReport) => r.lighthouse.performance >= 90,
    values: (r: QualityReport) => r.lighthouse,
  },
  {
    id: 'security',
    ok: (r: QualityReport) => r.security.strictCsp && r.security.runtimeAdvisories === 0,
    values: (r: QualityReport) => ({ advisories: r.security.runtimeAdvisories }),
  },
] as const;

/** Copy key for a line; the security line must not claim a strict CSP it lacks. */
const lineKey = (id: (typeof LINES)[number]['id'], report: QualityReport) =>
  id === 'security' && !report.security.strictCsp
    ? 'quality.lines.securityRelaxed'
    : `quality.lines.${id}`;

const cardClass =
  'rounded-2xl border border-gray-100 dark:border-neon-border bg-white dark:bg-neon-bg shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none';

const Quality: React.FC = () => {
  const { t } = useTranslation('common');
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetch('/quality.json', { cache: 'no-cache' })
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error(String(response.status))),
      )
      .then((data: unknown) => {
        if (cancelled) return;
        setState(
          isQualityReport(data) ? { status: 'ready', report: data } : { status: 'unavailable' },
        );
      })
      .catch(() => !cancelled && setState({ status: 'unavailable' }));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="animate-fade-in">
      <SEO title={t('quality.title')} description={t('quality.meta.description')} />
      <header className="mb-10">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">
            {t('quality.headingHighlight')}
          </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-yellow via-orange-500 to-accent-yellow-dark">
            {t('quality.headingRest')}
          </span>
        </h2>
        <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
          /quality · {t('quality.subtitle')}
        </p>
      </header>

      {state.status === 'unavailable' ? (
        <div className={`${cardClass} p-6`} role="status">
          <p className="text-gray-700 dark:text-gray-300">{t('quality.unavailable')}</p>
        </div>
      ) : (
        <div className="@container">
          <div
            className="grid gap-6 @3xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"
            aria-busy={state.status === 'loading'}
          >
            <div className={`${cardClass} p-6 font-mono text-sm leading-8`}>
              {state.status === 'loading' ? (
                <div className="space-y-3 py-1" aria-hidden="true">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-4 rounded bg-gray-100 dark:bg-white/5 animate-pulse"
                      style={{ width: `${88 - i * 7}%` }}
                    />
                  ))}
                </div>
              ) : (
                <TerminalLines report={state.report} />
              )}
            </div>

            <div className="grid gap-4 @lg:grid-cols-3 @3xl:grid-cols-1 content-start">
              {state.status === 'ready' && (
                <>
                  <Metric
                    label={t('quality.metrics.coverage')}
                    value={t('quality.metrics.coverageValue', {
                      value: state.report.unit.coverage,
                    })}
                  />
                  <Metric
                    label={t('quality.metrics.performance')}
                    value={String(state.report.lighthouse.performance)}
                  />
                  <Metric
                    label={t('quality.metrics.monitoring')}
                    value={t('quality.metrics.monitoringValue')}
                  />
                </>
              )}
            </div>
          </div>

          {state.status === 'ready' && (
            <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">{t('quality.footnote')}</p>
          )}
        </div>
      )}
    </section>
  );
};

const TerminalLines: React.FC<{ report: QualityReport }> = ({ report }) => {
  const { t, i18n } = useTranslation('common');
  const date = new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(report.builtAt));
  const passed = report.unit.passed + report.e2e.passed;
  const failed = report.unit.failed + report.e2e.failed;
  const allOk = LINES.every((line) => line.ok(report));

  // Lines tick in one after another; with reduced motion they are simply there.
  const reveal = (index: number) => ({
    className: 'motion-safe:opacity-0 motion-safe:animate-fade-in',
    style: { animationDelay: `${index * 120}ms` },
  });
  const summary = reveal(LINES.length + 1);

  return (
    <>
      <p className="text-gray-500 dark:text-gray-400 break-words">
        $ npm run verify · build {report.shortCommit} · {date}
      </p>
      <ul className="mt-1">
        {LINES.map((line, index) => {
          const ok = line.ok(report);
          const { className, style } = reveal(index + 1);
          return (
            <li key={line.id} className={`flex items-baseline gap-3 ${className}`} style={style}>
              <span
                aria-hidden="true"
                className={
                  ok ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                }
              >
                {ok ? '✓' : '✗'}
              </span>
              {/* The tick is colour and glyph only; say it in words for screen readers. */}
              <span className="sr-only">
                {ok ? t('quality.status.passed') : t('quality.status.failed')}:
              </span>
              <span className="w-24 shrink-0 text-gray-900 dark:text-white font-bold">
                {line.id}
              </span>
              <span className="text-gray-700 dark:text-gray-300 min-w-0">
                {t(lineKey(line.id, report), line.values(report))}
              </span>
            </li>
          );
        })}
      </ul>
      <p
        className={`mt-3 font-bold ${allOk ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'} ${summary.className}`}
        style={summary.style}
      >
        {t('quality.summary', { passed, failed, flaky: report.e2e.flaky })}
      </p>
    </>
  );
};

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className={`${cardClass} p-5`}>
    <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neon-text-tertiary">
      {label}
    </div>
    <div className="mt-1 text-3xl font-black tracking-tight text-gray-900 dark:text-white">
      {value}
    </div>
  </div>
);

export default Quality;
