/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'surface-base': '#080B0E',
        'surface-panel': '#0E1318',
        'surface-raised': '#141B22',
        'surface-overlay': '#1A232C',
        'neutral-muted': '#8A99A8',
        'neutral-border': '#1E2630',
        'neutral-border-active': '#2D3A49',
        'accent': '#0EA5E9',
        'accent-hover': '#38BDF8',
        'status-danger': '#F43F5E',
        'status-success': '#10B981',
        'status-warning': '#F59E0B',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
