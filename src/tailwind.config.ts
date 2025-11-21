import type { Config } from 'tailwindcss';

const config: Config = {
  // "Set the darkMode property for this object literal."
  darkMode: ['class'],
  // "Set the content property for this object literal."
  content: ['./index.html', './src/**/*.{ts,tsx}', './pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  // "Execute this line as part of the component logic."
  theme: {
    // "Execute this line as part of the component logic."
    fontFamily: {
      // "Set the sans property for this object literal."
      sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      // "Set the display property for this object literal."
      display: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      // "Set the mono property for this object literal."
      mono: ['"SF Mono"', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
    },
    // "Execute this line as part of the component logic."
    extend: {
      // "Execute this line as part of the component logic."
      borderRadius: {
        // "Execute this line as part of the component logic."
        'xl': '0.875rem',
        // "Execute this line as part of the component logic."
        '2xl': '1rem',
        // "Execute this line as part of the component logic."
        '3xl': '1.25rem',
        // "Execute this line as part of the component logic."
        '4xl': '1.5rem',
      },
      // "Execute this line as part of the component logic."
      transitionDuration: {
        // "Set the 200 property for this object literal."
        200: '200ms',
        // "Set the 300 property for this object literal."
        300: '300ms',
        // "Set the 400 property for this object literal."
        400: '400ms',
      },
      // "Execute this line as part of the component logic."
      fontSize: {
        // "Execute this line as part of the component logic."
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
        // "Execute this line as part of the component logic."
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],
        // "Execute this line as part of the component logic."
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
        // "Execute this line as part of the component logic."
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        // "Execute this line as part of the component logic."
        'xl': ['1.25rem', { lineHeight: '1.875rem', letterSpacing: '-0.01em' }],
        // "Execute this line as part of the component logic."
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
        // "Execute this line as part of the component logic."
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        // "Execute this line as part of the component logic."
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.03em' }],
      },
      // "Execute this line as part of the component logic."
      colors: {
        // Professional retail-focused color palette
        primary: {
          // "Set the DEFAULT property for this object literal."
          DEFAULT: '#2563eb', // Professional blue
          // "Set the 50 property for this object literal."
          50: '#eff6ff',
          // "Set the 100 property for this object literal."
          100: '#dbeafe',
          // "Set the 200 property for this object literal."
          200: '#bfdbfe',
          // "Set the 300 property for this object literal."
          300: '#93c5fd',
          // "Set the 400 property for this object literal."
          400: '#60a5fa',
          // "Set the 500 property for this object literal."
          500: '#3b82f6',
          // "Set the 600 property for this object literal."
          600: '#2563eb',
          // "Set the 700 property for this object literal."
          700: '#1d4ed8',
          // "Set the 800 property for this object literal."
          800: '#1e40af',
          // "Set the 900 property for this object literal."
          900: '#1e3a8a',
          // "Set the foreground property for this object literal."
          foreground: '#ffffff',
        },
        // "Execute this line as part of the component logic."
        secondary: {
          // "Set the DEFAULT property for this object literal."
          DEFAULT: '#0f172a', // Professional navy
          // "Set the 50 property for this object literal."
          50: '#f8fafc',
          // "Set the 100 property for this object literal."
          100: '#f1f5f9',
          // "Set the 200 property for this object literal."
          200: '#e2e8f0',
          // "Set the 300 property for this object literal."
          300: '#cbd5e1',
          // "Set the 400 property for this object literal."
          400: '#94a3b8',
          // "Set the 500 property for this object literal."
          500: '#64748b',
          // "Set the 600 property for this object literal."
          600: '#475569',
          // "Set the 700 property for this object literal."
          700: '#334155',
          // "Set the 800 property for this object literal."
          800: '#1e293b',
          // "Set the 900 property for this object literal."
          900: '#0f172a',
        },
        // "Execute this line as part of the component logic."
        accent: {
          // "Set the DEFAULT property for this object literal."
          DEFAULT: '#10b981', // Success green
          // "Set the 50 property for this object literal."
          50: '#f0fdf4',
          // "Set the 100 property for this object literal."
          100: '#dcfce7',
          // "Set the 200 property for this object literal."
          200: '#bbf7d0',
          // "Set the 300 property for this object literal."
          300: '#86efac',
          // "Set the 400 property for this object literal."
          400: '#4ade80',
          // "Set the 500 property for this object literal."
          500: '#22c55e',
          // "Set the 600 property for this object literal."
          600: '#16a34a',
          // "Set the 700 property for this object literal."
          700: '#15803d',
          // "Set the 800 property for this object literal."
          800: '#166534',
          // "Set the 900 property for this object literal."
          900: '#14532d',
        },
        // "Execute this line as part of the component logic."
        warning: {
          // "Set the DEFAULT property for this object literal."
          DEFAULT: '#f59e0b',
          // "Set the 50 property for this object literal."
          50: '#fffbeb',
          // "Set the 100 property for this object literal."
          100: '#fef3c7',
          // "Set the 200 property for this object literal."
          200: '#fde68a',
          // "Set the 300 property for this object literal."
          300: '#fcd34d',
          // "Set the 400 property for this object literal."
          400: '#fbbf24',
          // "Set the 500 property for this object literal."
          500: '#f59e0b',
          // "Set the 600 property for this object literal."
          600: '#d97706',
          // "Set the 700 property for this object literal."
          700: '#b45309',
          // "Set the 800 property for this object literal."
          800: '#92400e',
          // "Set the 900 property for this object literal."
          900: '#78350f',
        },
        // "Execute this line as part of the component logic."
        danger: {
          // "Set the DEFAULT property for this object literal."
          DEFAULT: '#ef4444',
          // "Set the 50 property for this object literal."
          50: '#fef2f2',
          // "Set the 100 property for this object literal."
          100: '#fee2e2',
          // "Set the 200 property for this object literal."
          200: '#fecaca',
          // "Set the 300 property for this object literal."
          300: '#fca5a5',
          // "Set the 400 property for this object literal."
          400: '#f87171',
          // "Set the 500 property for this object literal."
          500: '#ef4444',
          // "Set the 600 property for this object literal."
          600: '#dc2626',
          // "Set the 700 property for this object literal."
          700: '#b91c1c',
          // "Set the 800 property for this object literal."
          800: '#991b1b',
          // "Set the 900 property for this object literal."
          900: '#7f1d1d',
        },
        // "Execute this line as part of the component logic."
        surface: {
          // "Set the DEFAULT property for this object literal."
          DEFAULT: '#f8fafc', // Clean off-white
          // "Set the 50 property for this object literal."
          50: '#ffffff',
          // "Set the 100 property for this object literal."
          100: '#f8fafc',
          // "Set the 200 property for this object literal."
          200: '#f1f5f9',
          // "Set the 300 property for this object literal."
          300: '#e2e8f0',
          // "Set the elevated property for this object literal."
          elevated: '#ffffff',
          // "Set the glass property for this object literal."
          glass: 'rgba(255, 255, 255, 0.92)',
        },
        // "Execute this line as part of the component logic."
        ink: {
          // "Set the DEFAULT property for this object literal."
          DEFAULT: '#0f172a', // Professional dark text
          // "Set the 50 property for this object literal."
          50: '#f8fafc',
          // "Set the 100 property for this object literal."
          100: '#f1f5f9',
          // "Set the 200 property for this object literal."
          200: '#e2e8f0',
          // "Set the 300 property for this object literal."
          300: '#cbd5e1',
          // "Set the 400 property for this object literal."
          400: '#94a3b8',
          // "Set the 500 property for this object literal."
          500: '#64748b',
          // "Set the 600 property for this object literal."
          600: '#475569',
          // "Set the 700 property for this object literal."
          700: '#334155',
          // "Set the 800 property for this object literal."
          800: '#1e293b',
          // "Set the 900 property for this object literal."
          900: '#0f172a',
        },
        // "Execute this line as part of the component logic."
        border: {
          // "Set the DEFAULT property for this object literal."
          DEFAULT: '#e2e8f0',
          // "Set the subtle property for this object literal."
          subtle: '#f1f5f9',
          // "Set the strong property for this object literal."
          strong: '#cbd5e1',
        },
      },
      // "Execute this line as part of the component logic."
      boxShadow: {
        // "Execute this line as part of the component logic."
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        // "Execute this line as part of the component logic."
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        // "Execute this line as part of the component logic."
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        // "Execute this line as part of the component logic."
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        // "Execute this line as part of the component logic."
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        // "Execute this line as part of the component logic."
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        // "Execute this line as part of the component logic."
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        // "Execute this line as part of the component logic."
        'premium': '0 4px 16px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.1)',
        // "Execute this line as part of the component logic."
        'premium-lg': '0 8px 24px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(15, 23, 42, 0.08)',
        // "Execute this line as part of the component logic."
        'premium-xl': '0 16px 48px rgba(15, 23, 42, 0.15), 0 4px 16px rgba(15, 23, 42, 0.1)',
      },
      // "Execute this line as part of the component logic."
      backdropBlur: {
        // "Set the xs property for this object literal."
        xs: '2px',
      },
      // "Execute this line as part of the component logic."
      animation: {
        // "Execute this line as part of the component logic."
        'fade-in': 'fadeIn 0.4s ease-out',
        // "Execute this line as part of the component logic."
        'slide-up': 'slideUp 0.5s ease-out',
        // "Execute this line as part of the component logic."
        'slide-down': 'slideDown 0.5s ease-out',
        // "Execute this line as part of the component logic."
        'scale-in': 'scaleIn 0.3s ease-out',
        // "Execute this line as part of the component logic."
        'shimmer': 'shimmer 2s ease-in-out infinite',
      },
      // "Execute this line as part of the component logic."
      keyframes: {
        // "Execute this line as part of the component logic."
        fadeIn: {
          // "Execute this line as part of the component logic."
          '0%': { opacity: '0' },
          // "Execute this line as part of the component logic."
          '100%': { opacity: '1' },
        },
        // "Execute this line as part of the component logic."
        slideUp: {
          // "Execute this line as part of the component logic."
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          // "Execute this line as part of the component logic."
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // "Execute this line as part of the component logic."
        slideDown: {
          // "Execute this line as part of the component logic."
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          // "Execute this line as part of the component logic."
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // "Execute this line as part of the component logic."
        scaleIn: {
          // "Execute this line as part of the component logic."
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          // "Execute this line as part of the component logic."
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // "Execute this line as part of the component logic."
        shimmer: {
          // "Execute this line as part of the component logic."
          '0%': { backgroundPosition: '-200% center' },
          // "Execute this line as part of the component logic."
          '100%': { backgroundPosition: '200% center' },
        },
      },
    },
  },
  // "Set the plugins property for this object literal."
  plugins: [],
};

export default config;
