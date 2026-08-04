import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#2563EB',
        'accent-hover': '#1D4ED8',
        success: '#16A34A',
        warning: '#D97706',
        error: '#DC2626',
        'bg-page': '#F8F9FB',
        'bg-card': '#FFFFFF',
        'bg-sidebar': '#1A1A2E',
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        'text-on-dark': '#CBD5E1',
        border: '#E5E7EB',
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
