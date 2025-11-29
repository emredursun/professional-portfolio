import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedNameProps {
    name: string;
    variant: 'wave' | 'transform' | 'gradient' | 'hacker';
    className?: string;
}

const AnimatedName: React.FC<AnimatedNameProps> = ({ name, variant, className = '' }) => {
    const letters = name.split('');

    // Variant 1: Letter Wave/Bounce
    if (variant === 'wave') {
        return (
            <motion.h1 
                className={`text-3xl font-extrabold tracking-tight inline-flex ${className}`}
                initial="rest"
                whileHover="hover"
            >
                {letters.map((letter, index) => (
                    <motion.span
                        key={index}
                        className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 bg-clip-text text-transparent inline-block"
                        variants={{
                            rest: { y: 0 },
                            hover: { y: -8 }
                        }}
                        transition={{
                            delay: index * 0.03,
                            type: 'spring',
                            stiffness: 400,
                            damping: 10
                        }}
                    >
                        {letter === ' ' ? '\u00A0' : letter}
                    </motion.span>
                ))}
            </motion.h1>
        );
    }

    // Variant 2: Character-by-Character Transform (Scale + Rotate)
    if (variant === 'transform') {
        return (
            <motion.h1 
                className={`text-3xl font-extrabold tracking-tight inline-flex ${className}`}
                initial="rest"
                whileHover="hover"
            >
                {letters.map((letter, index) => (
                    <motion.span
                        key={index}
                        className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 bg-clip-text text-transparent inline-block origin-center"
                        variants={{
                            rest: { scale: 1, rotate: 0 },
                            hover: { 
                                scale: 1.2, 
                                rotate: index % 2 === 0 ? -5 : 5
                            }
                        }}
                        transition={{
                            delay: index * 0.04,
                            type: 'spring',
                            stiffness: 500,
                            damping: 15
                        }}
                    >
                        {letter === ' ' ? '\u00A0' : letter}
                    </motion.span>
                ))}
            </motion.h1>
        );
    }

    // Variant 3: Gradient Flow + Scale
    if (variant === 'gradient') {
        return (
            <motion.h1 
                className={`text-3xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-400 via-orange-400 via-pink-400 to-yellow-500 bg-clip-text text-transparent bg-[length:200%_auto] ${className}`}
                whileHover={{
                    scale: 1.05,
                    backgroundPosition: '200% center',
                }}
                transition={{
                    scale: {
                        type: 'spring',
                        stiffness: 300,
                        damping: 20
                    },
                    backgroundPosition: {
                        duration: 0.8,
                        ease: 'easeInOut'
                    }
                }}
                style={{
                    backgroundPosition: '0% center',
                }}
            >
                {name}
            </motion.h1>
        );
    }

    // Variant 4: Hacker/Matrix Effect (Character Scrambling)
    if (variant === 'hacker') {
        const HackerLetter: React.FC<{ letter: string; index: number; isParentHovered: boolean }> = ({ letter, index, isParentHovered }) => {
            const [displayChar, setDisplayChar] = React.useState(letter);
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';
            
            React.useEffect(() => {
                if (!isParentHovered) {
                    setDisplayChar(letter);
                    return;
                }
                
                let iteration = 0;
                const maxIterations = 10;
                
                const interval = setInterval(() => {
                    if (iteration < maxIterations) {
                        setDisplayChar(characters[Math.floor(Math.random() * characters.length)]);
                        iteration++;
                    } else {
                        setDisplayChar(letter);
                        clearInterval(interval);
                    }
                }, 30 + (index * 5)); // Stagger the scrambling by index
                
                return () => clearInterval(interval);
            }, [isParentHovered, letter, index]);
            
            return (
                <motion.span
                    className="bg-gradient-to-r from-green-700 via-emerald-800 to-green-700 dark:from-green-300 dark:via-emerald-300 dark:to-green-400 bg-clip-text text-transparent inline-block font-mono text-2xl md:text-3xl font-bold tracking-wide"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                    animate={{ 
                        opacity: isParentHovered ? 1 : 0.95,
                        filter: isParentHovered ? 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))' : 'none'
                    }}
                    transition={{ duration: 0.2 }}
                >
                    {displayChar === ' ' ? '\u00A0' : displayChar}
                </motion.span>
            );
        };

        const [isHovered, setIsHovered] = React.useState(false);

        return (
            <motion.h1 
                className={`text-3xl font-extrabold tracking-tight inline-flex ${className}`}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
            >
                {letters.map((letter, index) => (
                    <HackerLetter key={index} letter={letter} index={index} isParentHovered={isHovered} />
                ))}
            </motion.h1>
        );
    }

    return null;
};

export default AnimatedName;
