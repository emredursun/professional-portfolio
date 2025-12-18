import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from './hooks/useGSAP.tsx';

interface PreloaderProps {
    onComplete: () => void;
}

const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const [progress, setProgress] = useState(0);

    useGSAP(() => {
        const tl = gsap.timeline({
            onComplete: () => {
                onComplete();
            }
        });

        // Initial State
        gsap.set(textRef.current, { 
            opacity: 0,
            y: 20 
        });

        // Animation Sequence
        tl.to(textRef.current, {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out"
        })
        .to({}, {
            duration: 1.5, // Minimum display time simulation
            onUpdate: function() {
                const progressVal = Math.round(this.progress() * 100);
                setProgress(progressVal);
            }
        }, "-=0.5")
        .to(textRef.current, {
            scale: 1.1,
            opacity: 0,
            duration: 0.8,
            ease: "power2.in"
        })
        .to(containerRef.current, {
            y: "-100%",
            duration: 1,
            ease: "power4.inOut"
        }, "-=0.2");

    }, { scope: containerRef });

    return (
        <div 
            ref={containerRef} 
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black text-white overflow-hidden"
        >
            <div className="relative z-10 flex flex-col items-center gap-4">
                {/* Typographic Logo Construction */}
                <div ref={textRef} className="flex flex-col items-center">
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-2">
                        <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
                            EMRE
                        </span>
                        <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-accent-yellow via-yellow-400 to-amber-600 ml-4">
                            DURSUN
                        </span>
                    </h1>
                    <div className="h-1 w-24 bg-accent-yellow rounded-full mt-4"></div>
                </div>

                {/* Progress Indicator */}
                <div className="mt-8 font-mono text-sm text-gray-400">
                    {progress}%
                </div>
            </div>

            {/* Background Texture/Noise */}
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        </div>
    );
};

export default Preloader;
