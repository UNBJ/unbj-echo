import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-hover': 'rgb(var(--accent-hover) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        error: 'rgb(var(--error) / <alpha-value>)',
        'bg-page': 'rgb(var(--bg-page) / <alpha-value>)',
        'bg-card': 'rgb(var(--bg-card) / <alpha-value>)',
        'bg-subtle': 'rgb(var(--bg-subtle) / <alpha-value>)',
        'bg-sidebar': 'rgb(var(--bg-sidebar) / <alpha-value>)',
        'bg-sidebar-hover': 'rgb(var(--bg-sidebar-hover) / <alpha-value>)',
        'text-primary': 'rgb(var(--text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--text-secondary) / <alpha-value>)',
        'text-on-dark': 'rgb(var(--text-on-dark) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
      },
      fontFamily: {
        heading: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        body: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '10px',
        xl: '14px',
        '2xl': '20px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        pop: 'var(--shadow-pop)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'fade-up': 'fade-up 250ms ease-out',
      },
    },
  },
  plugins: [],
}

export default config
