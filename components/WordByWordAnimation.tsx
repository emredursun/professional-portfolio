import React from 'react';
import { motion } from 'framer-motion';

interface WordByWordAnimationProps {
    text: string;
    className?: string;
    staggerDelay?: number;
    initialDelay?: number;
    dropDistance?: number;
    animationDuration?: number;
    repeat?: boolean;
    repeatDelay?: number;
}

/**
 * WordByWordAnimation Component
 * 
 * Animates text word by word with a dropdown effect and staggered delays.
 * Each word drops from above with fade-in effect.
 * 
 * @param text - The text to animate (will be split by spaces)
 * @param className - Additional CSS classes to apply to each word
 * @param staggerDelay - Delay between each word animation (default: 0.1s)
 * @param initialDelay - Delay before first word starts (default: 0s)
 * @param dropDistance - Distance words drop from in pixels (default: 20px)
 * @param animationDuration - Duration of each word's animation (default: 0.5s)
 * @param repeat - Whether to infinitely repeat the animation (default: false)
 * @param repeatDelay - Delay before repeating the animation cycle (default: 2s)
 */
const WordByWordAnimation: React.FC<WordByWordAnimationProps> = ({
    text,
    className = '',
    staggerDelay = 0.1,
    initialDelay = 0,
    dropDistance = 20,
    animationDuration = 0.5,
    repeat = false,
    repeatDelay = 2,
}) => {
    // Split text into words
    const words = text.split(' ');
    
    // Calculate total animation time for one complete cycle
    const totalAnimationTime = (words.length * staggerDelay) + animationDuration;

    // Container variants for staggered children
    const containerVariants = {
        hidden: { opacity: 1 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: staggerDelay,
                delayChildren: initialDelay,
            },
        },
    };

    // Individual word variants with optional repeat
    const wordVariants = {
        hidden: {
            opacity: 0,
            y: -dropDistance,
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: animationDuration,
                ease: [0.25, 0.46, 0.45, 0.94], // Custom easing for smooth drop
                repeat: repeat ? Infinity : 0,
                repeatType: 'loop' as const,
                repeatDelay: repeat ? (repeatDelay + totalAnimationTime) : 0,
            },
        },
    };

    return (
        <motion.span
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="inline-flex flex-wrap gap-x-1.5"
        >
            {words.map((word, index) => (
                <motion.span
                    key={`${word}-${index}`}
                    variants={wordVariants}
                    className={`inline-block ${className}`}
                >
                    {word}
                </motion.span>
            ))}
        </motion.span>
    );
};

export default WordByWordAnimation;
