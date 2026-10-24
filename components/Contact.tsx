import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SOCIAL_LINKS } from '../constants.tsx';
import SEO from './SEO.tsx';
import { reportError } from '../src/utils/errorReporting.ts';
import { faviconController } from '../src/utils/faviconController.ts';

/**
 * Web3Forms access keys are public by design - they only identify the inbox.
 * Abuse protection comes from the honeypot below plus the domain allowlist
 * configured in the Web3Forms dashboard (restrict to emredursun.nl).
 */
const WEB3FORMS_ACCESS_KEY = '309ce373-4042-4a9a-b924-e7684e84ba0a';

/**
 * Google Maps embeds set Google cookies as soon as the iframe loads. Under the
 * AVG/GDPR that needs consent, so the map loads only when the visitor asks
 * for it (two-click pattern) - which also keeps a third-party page out of the
 * initial load.
 */
// The work location (Sopra Steria, Nieuwegein) at city level - never the home
// address; tests/privacy.test.ts guards this.
const MAP_EMBED_URL = 'https://www.google.com/maps?q=Nieuwegein,+Netherlands&z=12&output=embed';

type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

const SUBMIT_TIMEOUT_MS = 15000;

/**
 * A failed submission is reported as a fixed code only. Web3Forms' own error
 * text and anything derived from the visitor's input stay out of analytics.
 */
class ContactSubmitError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.name = 'ContactSubmitError';
    this.code = code;
  }
}

const ConfettiCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 300;
    canvas.height = canvas.parentElement?.clientHeight || 300;

    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
    }[] = [];
    const colors = ['#FBBF24', '#EF4444', '#3B82F6', '#10B981', '#F472B6'];

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 5 + 2,
      });
    }

    let animationId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // Gravity
        p.size *= 0.96; // Shrink

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Remove tiny particles
      for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].size < 0.5) particles.splice(i, 1);
      }

      if (particles.length > 0) {
        animationId = requestAnimationFrame(render);
      }
    };
    render();

    return () => cancelAnimationFrame(animationId);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-20" />;
};

const Contact: React.FC = () => {
  const { t } = useTranslation('contact');
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('idle');
  const [formStartTime, setFormStartTime] = useState<number>(0);
  const [showMap, setShowMap] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    formData.append('access_key', WEB3FORMS_ACCESS_KEY);

    // Honeypot: real visitors never see or tick this box. Bots that fill
    // every field get a fake success so they do not retry with variations.
    if (formData.get('botcheck')) {
      setSubmissionStatus('success');
      form.reset();
      return;
    }

    // Track form submission attempt
    const formDuration = formStartTime ? Date.now() - formStartTime : 0;

    setSubmissionStatus('submitting');

    // Show loading favicon
    faviconController.showLoading();

    // Track with Plausible if available
    window.plausible?.('form_submit', { props: { duration: formDuration } });

    // A request that never answers would leave the button spinning forever.
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) throw new ContactSubmitError(`http-${response.status}`);
      const data: { success?: boolean } = await response.json();

      if (data.success) {
        setSubmissionStatus('success');
        form.reset();
        setFormStartTime(0);

        // Hide loading and show notification
        faviconController.hideLoading();
        faviconController.showNotification(t('messages.success.notification'), 8000);

        // Track success
        window.plausible?.('form_success');
      } else {
        throw new ContactSubmitError('rejected');
      }
    } catch (error) {
      const code =
        error instanceof ContactSubmitError
          ? error.code
          : controller.signal.aborted
            ? 'timeout'
            : 'network';
      reportError(new ContactSubmitError(code), 'promise');
      setSubmissionStatus('error');

      // Hide loading
      faviconController.hideLoading();

      // Track error
      window.plausible?.('form_error');
    } finally {
      window.clearTimeout(timeout);
    }
  };

  // Track form start
  const handleFormFocus = () => {
    if (!formStartTime) {
      setFormStartTime(Date.now());

      // Track form start
      window.plausible?.('form_start');
    }
  };

  const renderFormContent = () => {
    switch (submissionStatus) {
      case 'success':
        return (
          <div
            role="status"
            className="bg-white dark:bg-black/60 backdrop-blur-xl border border-gray-200 dark:border-neon-border rounded-[2rem] p-8 flex flex-col items-center justify-center text-center h-[436px] animate-fade-in relative overflow-hidden shadow-2xl dark:shadow-[0_0_40px_-10px_rgba(6,182,212,0.3)]"
          >
            <ConfettiCanvas />
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6 animate-icon-pop-in z-10 border border-green-300 dark:border-green-500/30">
              <i aria-hidden="true" className="fas fa-check text-4xl text-green-500"></i>
            </div>
            <h4 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 z-10">
              {t('messages.success.title')}
            </h4>
            <p className="text-gray-700 dark:text-gray-300 text-lg z-10">
              {t('messages.success.description')}
              <br />
              {t('messages.success.followUp')}
            </p>
          </div>
        );
      // A failure keeps the form - and what the visitor typed - on screen
      // with the error above the button; it used to replace the form
      // and "Try again" brought back an empty one.
      case 'error':
      case 'idle':
      case 'submitting':
      default:
        return (
          <div className="bg-white dark:bg-black/60 backdrop-blur-xl border border-gray-200 dark:border-neon-border rounded-[2rem] p-8 shadow-2xl dark:shadow-[0_0_40px_-10px_rgba(6,182,212,0.15)]">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Web3Forms honeypot - hidden from people and assistive tech. */}
              <input
                type="checkbox"
                name="botcheck"
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <div className="group">
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  maxLength={100}
                  aria-label={t('form.name.label')}
                  placeholder={t('form.name.placeholder')}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-neon-cyan focus:border-transparent transition-all duration-300 hover:border-yellow-400 dark:hover:border-neon-cyan focus:shadow-[0_0_20px_rgba(234,179,8,0.2)] dark:focus:shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                  required
                  disabled={submissionStatus === 'submitting'}
                  onFocus={handleFormFocus}
                />
              </div>
              <div className="group">
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  maxLength={254}
                  aria-label={t('form.email.label')}
                  placeholder={t('form.email.placeholder')}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-neon-cyan focus:border-transparent transition-all duration-300 hover:border-yellow-400 dark:hover:border-neon-cyan focus:shadow-[0_0_20px_rgba(234,179,8,0.2)] dark:focus:shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                  required
                  disabled={submissionStatus === 'submitting'}
                  onFocus={handleFormFocus}
                />
              </div>
              <div className="group">
                <textarea
                  name="message"
                  maxLength={5000}
                  aria-label={t('form.message.label')}
                  placeholder={t('form.message.placeholder')}
                  rows={5}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-neon-cyan focus:border-transparent transition-all duration-300 hover:border-yellow-400 dark:hover:border-neon-cyan focus:shadow-[0_0_20px_rgba(234,179,8,0.2)] dark:focus:shadow-[0_0_20px_rgba(6,182,212,0.2)] resize-none"
                  required
                  minLength={20}
                  disabled={submissionStatus === 'submitting'}
                  onFocus={handleFormFocus}
                  title={t('form.message.tooShort')}
                ></textarea>
              </div>
              {submissionStatus === 'error' && (
                <div
                  role="alert"
                  className="flex gap-3 items-start rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-4 text-left"
                >
                  <i
                    aria-hidden="true"
                    className="fas fa-exclamation-triangle text-red-500 mt-1"
                  ></i>
                  <div>
                    <p className="font-bold text-red-800 dark:text-red-300">
                      {t('messages.error.title')}
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {t('messages.error.description')}
                    </p>
                  </div>
                </div>
              )}
              <button
                type="submit"
                aria-describedby="contact-data-notice"
                className="w-full bg-yellow-400 text-black font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-yellow-500 transition-all duration-300 disabled:bg-yellow-300 disabled:cursor-not-allowed hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                disabled={submissionStatus === 'submitting'}
              >
                {submissionStatus === 'submitting' ? (
                  <>
                    <i aria-hidden="true" className="fas fa-spinner fa-spin"></i>
                    {t('buttons.sending', { ns: 'common' })}
                  </>
                ) : (
                  <>
                    <i aria-hidden="true" className="fas fa-paper-plane"></i>
                    {t('buttons.sendMessage', { ns: 'common' })}
                  </>
                )}
              </button>
              {/* Where the message goes and what it is used for,
                                before anyone sends it. */}
              <p
                id="contact-data-notice"
                className="text-xs leading-relaxed text-gray-600 dark:text-gray-400"
              >
                {t('form.notice.text')}{' '}
                <a
                  href="https://web3forms.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-gray-900 dark:hover:text-white"
                >
                  {t('form.notice.link')}
                </a>
              </p>
            </form>
          </div>
        );
    }
  };

  return (
    <section>
      <SEO
        title={t('title')}
        description={t(
          'meta.description',
          'Get in touch with me for automation engineering opportunities or collaboration.',
        )}
      />
      <header className="mb-12">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">
            {t('title')}{' '}
          </span>
          <span className="relative inline-block">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-yellow via-orange-500 to-accent-yellow-dark animate-gradient bg-[length:200%_auto]">
              {t('titleHighlight')}
            </span>
            <span className="absolute inset-0 blur-lg bg-gradient-to-r from-accent-yellow via-orange-500 to-accent-yellow-dark opacity-50 animate-pulse-slow"></span>
            {/* Animated Underline */}
            <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-accent-yellow via-orange-500 to-accent-yellow-dark animate-gradient bg-[length:200%_auto]"></span>
          </span>
        </h2>
      </header>
      <div className="flex flex-col xl:flex-row gap-12">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-400/10 flex items-center justify-center text-yellow-400">
              <i aria-hidden="true" className="fas fa-envelope-open-text"></i>
            </div>
            {t('sections.form')}
          </h3>
          {renderFormContent()}
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-400/10 flex items-center justify-center text-yellow-400">
              <i aria-hidden="true" className="fas fa-map-marked-alt"></i>
            </div>
            {t('sections.findMe')}
          </h3>
          <div className="h-[300px] rounded-[2rem] overflow-hidden border border-gray-200 dark:border-neon-border shadow-2xl dark:shadow-none group relative transition-all duration-500 hover:-translate-y-1 hover:border-yellow-500 hover:shadow-[0_30px_60px_-15px_rgba(234,179,8,0.6)] dark:hover:border-neon-cyan dark:hover:shadow-[0_20px_40px_rgba(6,182,212,0.3)]">
            <div className="absolute inset-0 border-4 border-transparent group-hover:border-yellow-400/30 dark:group-hover:border-neon-cyan/30 transition-colors duration-300 pointer-events-none z-10 rounded-[2rem]"></div>
            {showMap ? (
              <iframe
                src={MAP_EMBED_URL}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                title={t('map.title')}
                className="dark:grayscale-[100%] dark:invert-[100%] transition-transform duration-700 group-hover:scale-105"
              ></iframe>
            ) : (
              <button
                type="button"
                onClick={() => setShowMap(true)}
                className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                <i
                  className="fas fa-map-marked-alt text-4xl text-yellow-500 dark:text-neon-cyan"
                  aria-hidden="true"
                ></i>
                <span className="font-bold">{t('map.load')}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400 px-6 text-center">
                  {t('map.notice')}
                </span>
              </button>
            )}
          </div>
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {t('sections.followMe')}
            </h3>
            <div className="flex gap-4">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('labels.followOn', { ns: 'common', name: link.name })}
                  className="w-14 h-14 rounded-2xl bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-gray-200/50 dark:border-neon-border flex items-center justify-center text-2xl text-gray-500 dark:text-gray-400 hover:text-white dark:hover:text-black hover:bg-yellow-400 dark:hover:bg-neon-cyan transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_20px_-5px_rgba(234,179,8,0.5)] dark:hover:shadow-[0_10px_20px_-5px_rgba(6,182,212,0.5)] hover:rotate-12 hover:scale-110"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
