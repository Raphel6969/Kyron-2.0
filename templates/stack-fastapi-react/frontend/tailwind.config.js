/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          base: "var(--color-surface-base)",
          raised: "var(--color-surface-raised)",
        },
        neutral: {
          muted: "var(--color-neutral-muted)",
          border: "var(--color-neutral-border)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
        },
      },
    },
  },
  plugins: [],
}
