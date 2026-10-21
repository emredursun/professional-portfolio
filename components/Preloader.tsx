import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from './hooks/useGSAP.tsx';

interface PreloaderProps {
    /** Fired as the curtain starts lifting - mount the page behind it now. */
    onReveal: () => void;
    /** Fired once the curtain is fully off-screen - unmount the preloader. */
    onComplete: () => void;
}

const SESSION_KEY = 'preloaderShown';

/**
 * Whether the branded intro should play on this page load.
 *
 * Skipped for visitors who asked for reduced motion, and after the first
 * showing in a browser session, so in-session reloads and returning
 * navigations go straight to content.
 */
export function shouldShowPreloader(): boolean {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
    try {
        if (sessionStorage.getItem(SESSION_KEY)) return false;
        sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
        // Storage can be unavailable (private mode, blocked site data);
        // fall back to showing the intro rather than failing.
    }
    return true;
}

/**
 * The intro used to hold the whole app unmounted for ~4.3s, including a
 * deliberate 1.5s "minimum display time" - which put LCP past 3s on its own.
 * It now runs ~1.3s and hands over to the page before it finishes: the
 * content mounts while the curtain slides away instead of after.
 */
const Preloader: React.FC<PreloaderProps> = ({ onReveal, onComplete }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const [progress, setProgress] = useState(0);

    useGSAP(() => {
        const tl = gsap.timeline({ onComplete });

        // No fade-in: index.html ships an identical static copy of this screen
        // inside #root, painted before any JavaScript runs. Starting from the
        // same visible state lets React take over without a flicker.
        tl.to({}, {
            duration: 0.5,
            onUpdate: function () {
                setProgress(Math.round(this.progress() * 100));
            }
        })
        .to(textRef.current, {
            scale: 1.1,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in'
        })
        .call(onReveal)
        .to(containerRef.current, {
            y: '-100%',
            duration: 0.5,
            ease: 'power4.inOut'
        });
    }, []);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black text-white overflow-hidden"
            aria-hidden="true"
            data-testid="preloader"
        >
            <div className="relative z-10 flex flex-col items-center gap-4">
                {/* Typographic Logo Construction */}
                <div ref={textRef} className="flex flex-col items-center">
                    <p className="text-6xl md:text-8xl font-black tracking-tighter mb-2">
                        <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
                            EMRE
                        </span>
                        <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-accent-yellow via-yellow-400 to-amber-600 ml-4">
                            DURSUN
                        </span>
                    </p>
                    <div className="h-1 w-24 bg-accent-yellow rounded-full mt-4"></div>
                </div>

                {/* Progress Indicator */}
                <div className="mt-8 font-mono text-sm text-gray-400">
                    {progress}%
                </div>
            </div>

            {/* Same inline SVG grain as `.bg-noise` in index.css. Previously
                hot-linked from grainy-gradients.vercel.app, which now answers
                402 Payment Required and logged a console error on every load. */}
            <div className="bg-noise absolute inset-0 opacity-[0.03]"></div>
        </div>
    );
};

export default Preloader;
