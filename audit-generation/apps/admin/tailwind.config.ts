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
        'bg-page': '#F1F5F9',
        'bg-card': '#FFFFFF',
        'bg-sidebar': '#1E293B',
        'bg-sidebar-hover': '#334155',
        'text-primary': '#0F172A',
        'text-secondary': '#64748B',
        'text-on-dark': '#CBD5E1',
        border: '#E2E8F0',
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
