
import React, { useState, useRef, useEffect } from 'react';
import { SOCIAL_LINKS } from '../constants.tsx';

const PageTitle: React.FC<{ title: string }> = React.memo(({ title }) => (
    <div className="mb-12">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white relative inline-block">
            {title}
            <span className="absolute bottom-[-10px] left-0 w-full h-1 bg-yellow-400 rounded-full"></span>
        </h2>
    </div>
));

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

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        setSubmissionStatus('submitting');

        try {
            // Simulate an API call that might fail
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (Math.random() > 0.1) { // 90% success rate
                        resolve('Success!');
                    } else {
                        reject(new Error('Failed to send message.'));
                    }
                }, 1500);
            });
            setSubmissionStatus('success');
            form.reset();
        } catch (error) {
            setSubmissionStatus('error');
        }
    };

    const renderFormContent = () => {
        switch (submissionStatus) {
            case 'success':
                return (
                    <div className="bg-gray-50 dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-[436px] animate-fade-in relative overflow-hidden">
                        <ConfettiCanvas />
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6 animate-icon-pop-in z-10">
                            <i className="fas fa-check text-4xl text-green-500"></i>
                        </div>
                        <h4 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 z-10">Thank You!</h4>
                        <p className="text-gray-600 dark:text-gray-300 text-lg z-10">Your message has been sent successfully.<br/>I will get back to you soon.</p>
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
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="group">
                            <input
                                type="text"
                                placeholder="Full Name"
                                className="w-full bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300 hover:border-yellow-400 hover:shadow-md focus:shadow-lg focus:scale-[1.01]"
                                required
                                disabled={submissionStatus === 'submitting'}
                            />
                        </div>
                        <div className="group">
                            <input
                                type="email"
                                placeholder="Email Address"
                                className="w-full bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300 hover:border-yellow-400 hover:shadow-md focus:shadow-lg focus:scale-[1.01]"
                                required
                                disabled={submissionStatus === 'submitting'}
                            />
                        </div>
                        <div className="group">
                            <textarea
                                placeholder="Your Message"
                                rows={5}
                                className="w-full bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300 hover:border-yellow-400 hover:shadow-md focus:shadow-lg focus:scale-[1.01] resize-none"
                                required
                                disabled={submissionStatus === 'submitting'}
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-yellow-400 text-gray-900 font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-yellow-500 transition-all duration-300 disabled:bg-yellow-300 disabled:cursor-not-allowed hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:scale-[1.02] active:scale-[0.98]"
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
                );
        }
    };

    return (
        <section>
            <PageTitle title="Contact" />
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
                     <div className="h-[300px] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg group relative">
                        <div className="absolute inset-0 border-4 border-transparent group-hover:border-yellow-400/30 transition-colors duration-300 pointer-events-none z-10 rounded-2xl"></div>
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
                                    className="w-14 h-14 bg-gray-100 dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-2xl flex items-center justify-center text-2xl shadow-md text-gray-500 dark:text-gray-400 hover:text-white hover:bg-yellow-400 dark:hover:bg-yellow-500 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-yellow-400/30 hover:rotate-[360deg]"
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
