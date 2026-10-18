/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'surface-base': '#0A0D12',
        'surface-raised': '#121722',
        'surface-overlay': '#161D2C',
        'neutral-muted': '#7E8C9F',
        'neutral-border': '#1C2433',
        'accent': '#2563EB',
        'accent-hover': '#1D4ED8',
        'status-danger': '#EF4444',
        'status-success': '#10B981',
        'status-warning': '#F59E0B',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
