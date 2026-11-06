/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#6C4CF1', // Deep Violet primary
          700: '#5835ea',
          800: '#4722d6',
          900: '#3816b3',
          950: '#210b7a',
        },
        navy: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#172033', // Dark Navy text
          950: '#0b111e',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        silver: {
          50: '#f8fafc',
          100: '#f1f5f9',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
        },
        bronze: {
          50: '#fff7ed',
          100: '#ffedd5',
          400: '#fb923c',
          500: '#ea580c',
          600: '#c2410c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft-sm': '0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)',
        'soft': '0 4px 12px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.03)',
        'soft-md': '0 8px 24px rgba(15, 23, 42, 0.07), 0 2px 6px rgba(15, 23, 42, 0.04)',
        'soft-lg': '0 16px 36px rgba(15, 23, 42, 0.09), 0 4px 12px rgba(15, 23, 42, 0.05)',
        'glass': '0 8px 32px 0 rgba(108, 76, 241, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'glass-hover': '0 14px 40px -4px rgba(108, 76, 241, 0.12), 0 2px 6px 0 rgba(0, 0, 0, 0.05)',
        'glass-inner': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.9), 0 10px 30px -5px rgba(108, 76, 241, 0.08)',
        'violet-glow': '0 0 25px -4px rgba(108, 76, 241, 0.35)',
        'gold-glow': '0 0 25px -4px rgba(245, 158, 11, 0.35)',
      },
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      animation: {
        'aurora': 'aurora 20s ease-in-out infinite alternate',
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'gradient-border': 'gradientBorder 4s linear infinite',
      },
      keyframes: {
        aurora: {
          '0%': { transform: 'translate(0%, 0%) scale(1)' },
          '50%': { transform: 'translate(-5%, 8%) scale(1.08)' },
          '100%': { transform: 'translate(5%, -5%) scale(0.96)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        gradientBorder: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
    },
  },
  plugins: [],
}
