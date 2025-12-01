
import React, { useState, useRef, useEffect } from 'react';
import { SOCIAL_LINKS } from '../constants.tsx';


type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

const ConfettiCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = canvas.parentElement?.clientWidth || 300;
        canvas.height = canvas.parentElement?.clientHeight || 300;

        const particles: { x: number; y: number; vx: number;vy: number; color: string; size: number }[] = [];
        const colors = ['#FBBF24', '#EF4444', '#3B82F6', '#10B981', '#F472B6'];

        for (let i = 0; i < 100; i++) {
            particles.push({
                x: canvas.width / 2,
                y: canvas.height / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 5 + 2
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
    const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('idle');
    const [formStartTime, setFormStartTime] = useState<number>(0);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        
        // Add Web3Forms access key
        formData.append("access_key", "309ce373-4042-4a9a-b924-e7684e84ba0a");
        
        // Track form submission attempt
        const formDuration = formStartTime ? Date.now() - formStartTime : 0;
        
        setSubmissionStatus('submitting');
        
        // Show loading favicon
        if (typeof window !== 'undefined' && (window as any).faviconController) {
            (window as any).faviconController.showLoading();
        }
        
        // Track with Plausible if available
        if (typeof window !== 'undefined' && (window as any).plausible) {
            (window as any).plausible('form_submit', { 
                props: { duration: formDuration } 
            });
        }

        try {
            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                setSubmissionStatus('success');
                form.reset();
                setFormStartTime(0);
                
                // Hide loading and show notification
                if (typeof window !== 'undefined' && (window as any).faviconController) {
                    (window as any).faviconController.hideLoading();
                    (window as any).faviconController.showNotification('Message sent! ✉️', 8000);
                }
                
                // Track success
                if (typeof window !== 'undefined' && (window as any).plausible) {
                    (window as any).plausible('form_success');
                }
            } else {
                throw new Error(data.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            setSubmissionStatus('error');
            
            // Hide loading
            if (typeof window !== 'undefined' && (window as any).faviconController) {
                (window as any).faviconController.hideLoading();
            }
            
            // Track error
            if (typeof window !== 'undefined' && (window as any).plausible) {
                (window as any).plausible('form_error');
            }
        }
    };

    // Track form start
    const handleFormFocus = () => {
        if (!formStartTime) {
            setFormStartTime(Date.now());
            
            // Track form start
            if (typeof window !== 'undefined' && (window as any).plausible) {
                (window as any).plausible('form_start');
            }
        }
    };

    const renderFormContent = () => {
        switch (submissionStatus) {
            case 'success':
                return (
                    <div className="bg-white dark:bg-black/60 backdrop-blur-xl border border-gray-200 dark:border-neon-border rounded-[2rem] p-8 flex flex-col items-center justify-center text-center h-[436px] animate-fade-in relative overflow-hidden shadow-2xl dark:shadow-[0_0_40px_-10px_rgba(6,182,212,0.3)]">
                        <ConfettiCanvas />
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6 animate-icon-pop-in z-10 border border-green-300 dark:border-green-500/30">
                            <i className="fas fa-check text-4xl text-green-500"></i>
                        </div>
                        <h4 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 z-10">Thank You!</h4>
                        <p className="text-gray-700 dark:text-gray-300 text-lg z-10">Your message has been sent successfully.<br/>I will get back to you soon.</p>
                    </div>
                );
            case 'error':
                 return (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-[436px] animate-fade-in">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                            <i className="fas fa-exclamation-triangle text-4xl text-red-500"></i>
                        </div>
                        <h4 className="text-2xl font-bold text-red-800 dark:text-red-300 mb-2">Submission Failed</h4>
                        <p className="text-red-600 dark:text-red-400 mb-8">Something went wrong. Please try again.</p>
                        <button
                            onClick={() => setSubmissionStatus('idle')}
                            className="bg-yellow-400 text-gray-900 font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 hover:bg-yellow-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                        >
                            <i className="fas fa-redo"></i>
                            Try Again
                        </button>
                    </div>
                );
            case 'idle':
            case 'submitting':
            default:
                return (
                    <div className="bg-white dark:bg-black/60 backdrop-blur-xl border border-gray-200 dark:border-neon-border rounded-[2rem] p-8 shadow-2xl dark:shadow-[0_0_40px_-10px_rgba(6,182,212,0.15)]">
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="group">
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Full Name"
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
                                    placeholder="Email Address"
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-neon-cyan focus:border-transparent transition-all duration-300 hover:border-yellow-400 dark:hover:border-neon-cyan focus:shadow-[0_0_20px_rgba(234,179,8,0.2)] dark:focus:shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                                    required
                                    disabled={submissionStatus === 'submitting'}
                                    onFocus={handleFormFocus}
                                />
                            </div>
                            <div className="group">
                                <textarea
                                    name="message"
                                    placeholder="Your Message"
                                    rows={5}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-neon-cyan focus:border-transparent transition-all duration-300 hover:border-yellow-400 dark:hover:border-neon-cyan focus:shadow-[0_0_20px_rgba(234,179,8,0.2)] dark:focus:shadow-[0_0_20px_rgba(6,182,212,0.2)] resize-none"
                                    required
                                    disabled={submissionStatus === 'submitting'}
                                    onFocus={handleFormFocus}
                                ></textarea>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-yellow-400 text-black font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-yellow-500 transition-all duration-300 disabled:bg-yellow-300 disabled:cursor-not-allowed hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                                disabled={submissionStatus === 'submitting'}
                            >
                                 {submissionStatus === 'submitting' ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-paper-plane"></i>
                                        Send Message
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                );
        }
    };

    return (
        <section>
            <header className="mb-12">
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">Contact </span>
                    <span className="relative inline-block">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-yellow via-orange-500 to-accent-yellow-dark animate-gradient bg-[length:200%_auto]">
                            Me
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
                            <i className="fas fa-envelope-open-text"></i>
                        </div>
                        Contact Form
                    </h3>
                    {renderFormContent()}
                </div>
                <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-400/10 flex items-center justify-center text-yellow-400">
                            <i className="fas fa-map-marked-alt"></i>
                        </div>
                        Find Me Here
                    </h3>
                     <div className="h-[300px] rounded-[2rem] overflow-hidden border border-gray-200 dark:border-neon-border shadow-2xl dark:shadow-none group relative transition-all duration-500 hover:-translate-y-1 hover:border-yellow-500 hover:shadow-[0_30px_60px_-15px_rgba(234,179,8,0.6)] dark:hover:border-neon-cyan dark:hover:shadow-[0_20px_40px_rgba(6,182,212,0.3)]">
                        <div className="absolute inset-0 border-4 border-transparent group-hover:border-yellow-400/30 dark:group-hover:border-neon-cyan/30 transition-colors duration-300 pointer-events-none z-10 rounded-[2rem]"></div>
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d38740.16919139266!2d5.13280806443481!3d52.69614777894901!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c61c3b531a3977%3A0x868b248a39151740!2sHoogkarspel!5e0!3m2!1sen!2snl!4v1721323330345!5m2!1sen!2snl"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen={true}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Location Map"
                            className="dark:grayscale-[100%] dark:invert-[100%] transition-transform duration-700 group-hover:scale-105"
                        ></iframe>
                    </div>
                    <div className="mt-12">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Follow Me</h3>
                        <div className="flex gap-4">
                            {SOCIAL_LINKS.map(link => (
                                <a
                                    key={link.name}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`Follow me on ${link.name}`}
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
