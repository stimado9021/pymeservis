import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        tienda: {
          50: '#f3f0ff',
          100: '#e5deff',
          200: '#c9b8ff',
          300: '#a78bfa',
          400: '#8b5cf6',
          500: '#6C5CE7',
          600: '#5b4cdb',
          700: '#4a3ccb',
          800: '#3d31a8',
          900: '#2d2480',
        },
        coral: {
          50: '#fff5f5',
          100: '#ffe0e0',
          200: '#ffb8b8',
          300: '#ff8a8a',
          400: '#ff6b6b',
          500: '#ff5252',
          600: '#e63939',
          700: '#cc2d2d',
          800: '#b32424',
          900: '#991c1c',
        },
        surface: {
          50: '#ffffff',
          100: '#f8f9fa',
          200: '#e9ecef',
          300: '#dee2e6',
        },
        brand: {
          50: '#f3f0ff',
          500: '#6C5CE7',
          600: '#5b4cdb',
          700: '#4a3ccb',
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(108, 92, 231, 0.08)',
        'card-hover': '0 4px 16px rgba(108, 92, 231, 0.12)',
        'soft': '0 4px 20px rgba(0, 0, 0, 0.05)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
