/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#05070d',
          900: '#080b14',
          800: '#0d1220',
          700: '#151c2e'
        },
        vision: {
          50: '#ecfdf6',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' }
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(45, 212, 191, 0.45)' },
          '70%': { boxShadow: '0 0 0 18px rgba(45, 212, 191, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(45, 212, 191, 0)' }
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' }
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        pulseRing: 'pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        scanline: 'scanline 3.5s linear infinite',
        fadeUp: 'fadeUp 0.45s ease-out both'
      }
    }
  },
  plugins: []
};
