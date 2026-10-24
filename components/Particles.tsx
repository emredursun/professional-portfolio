import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ParticlesProps {
    count?: number;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
    drift: number;
}

function createParticles(count: number): Particle[] {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 2, // 2-4px
        duration: Math.random() * 20 + 20, // 20-40s
        delay: Math.random() * 5, // 0-5s delay
        drift: Math.random() * 20 - 10, // sideways sway, -10 to 10px
    }));
}

const Particles: React.FC<ParticlesProps> = ({ count = 25 }) => {
    // Random once per mount: a useState initializer, not useMemo (which React
    // may recompute). The sideways drift used to be drawn on every render,
    // giving each particle a new animation target whenever the sidebar
    // re-rendered.
    const [particles] = useState(() => createParticles(count));

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className="absolute rounded-full bg-yellow-400/20 dark:bg-yellow-400/10"
                    style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        width: particle.size,
                        height: particle.size,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        x: [0, particle.drift, 0],
                        opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        delay: particle.delay,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </div>
    );
};

export default Particles;
