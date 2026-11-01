/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'surface-base': '#F8FAFC',
        'surface-panel': '#FFFFFF',
        'surface-raised': '#FFFFFF',
        'surface-subtle': '#F1F5F9',
        'surface-sidebar': '#0F172A',
        'text-primary': '#0F172A',
        'text-secondary': '#475569',
        'text-muted': '#94A3B8',
        'neutral-border': '#E2E8F0',
        'neutral-border-active': '#CBD5E1',
        'accent': '#1D4ED8',
        'accent-hover': '#1E40AF',
        'accent-subtle': '#EFF6FF',
        'status-danger': '#DC2626',
        'status-danger-subtle': '#FEF2F2',
        'status-success': '#059669',
        'status-success-subtle': '#ECFDF5',
        'status-warning': '#D97706',
        'status-warning-subtle': '#FFFBEB',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'monospace'],
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
