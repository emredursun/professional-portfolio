/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      colors: {
        // Primary brand color
        primary: {
          DEFAULT: '#fbbf24', // Yellow-400
          dark: '#f59e0b',    // Yellow-500
        },
        
        // Neon Minimalism Palette
        neon: {
          bg: '#000000',
          card: '#050505',
          surface: '#0a0a0a',
          border: 'rgba(255, 255, 255, 0.2)',
          cyan: '#06b6d4',
          purple: '#a855f7',
          text: {
            primary: '#FFFFFF',
            secondary: '#e5e5e5',
            tertiary: '#a3a3a3',
          },
        },

        // Premium Dark Mode with Proper Elevation
        dark: {
          bg: '#0a0a0a',
          surface: '#141414',
          card: '#1a1a1a',
          elevated: '#202020',
          border: {
            subtle: 'rgba(255, 255, 255, 0.06)',
            DEFAULT: 'rgba(255, 255, 255, 0.1)',
            strong: 'rgba(255, 255, 255, 0.15)',
          },
          text: {
            primary: '#f5f5f5',
            secondary: '#b8b8b8',
            tertiary: '#8a8a8a',
            disabled: '#5a5a5a',
          },
        },

        // Enhanced Accent System
        accent: {
          yellow: {
            DEFAULT: '#fbbf24',
            light: '#fcd34d',
            dark: '#f59e0b',
            glow: 'rgba(251, 191, 36, 0.2)',
          },
          blue: {
            DEFAULT: '#3b82f6',
            light: '#60a5fa',
            dark: '#2563eb',
            glow: 'rgba(59, 130, 246, 0.2)',
          },
        },
      },
      boxShadow: {
        // Neon Shadows
        'neon-cyan': '0 0 5px rgba(6, 182, 212, 0.5), 0 0 20px rgba(6, 182, 212, 0.3)',
        'neon-purple': '0 0 5px rgba(168, 85, 247, 0.5), 0 0 20px rgba(168, 85, 247, 0.3)',
        'neon-white': '0 0 5px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.2)',
        
        // Premium shadows
        'dark-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
        'dark-md': '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        'dark-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
        'dark-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
        'dark-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        'glow-yellow': '0 0 20px rgba(251, 191, 36, 0.3), 0 0 40px rgba(251, 191, 36, 0.1)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1)',
        
        // Neumorphic Shadows
        'neu-flat': 'none',
        'neu-sm': '3px 3px 6px rgba(0, 0, 0, 0.4), -3px -3px 6px rgba(255, 255, 255, 0.02)',
        'neu-md': '6px 6px 12px rgba(0, 0, 0, 0.5), -6px -6px 12px rgba(255, 255, 255, 0.03)',
        'neu-lg': '10px 10px 20px rgba(0, 0, 0, 0.6), -10px -10px 20px rgba(255, 255, 255, 0.04)',
        'neu-inset-sm': 'inset 3px 3px 6px rgba(0, 0, 0, 0.5), inset -3px -3px 6px rgba(255, 255, 255, 0.02)',
        'neu-inset-md': 'inset 6px 6px 12px rgba(0, 0, 0, 0.6), inset -6px -6px 12px rgba(255, 255, 255, 0.03)',
        'neu-accent': '0 0 20px rgba(251, 191, 36, 0.1)',
      },
      animation: {
        blob: 'blob 10s infinite alternate cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s linear infinite',
        'bounce-custom': 'bounceCustom 1s infinite',
        gradient: 'gradient 8s linear infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'shimmer-slide': 'shimmerSlide 2.5s infinite',
        'border-spin': 'borderSpin 3s linear infinite',
      },
      keyframes: {
        bounceCustom: {
          '0%, 100%': {
            transform: 'translateY(-25%)',
            animationTimingFunction: 'cubic-bezier(0.8,0,1,1)',
          },
          '50%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0,0,0.2,1)',
          },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        glowPulse: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(251, 191, 36, 0.4), 0 0 40px rgba(251, 191, 36, 0.1)',
          },
          '50%': {
            boxShadow: '0 0 30px rgba(251, 191, 36, 0.6), 0 0 60px rgba(251, 191, 36, 0.2)',
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmerSlide: {
          '0%': { backgroundPosition: '-100% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        borderSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
