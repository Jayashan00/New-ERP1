/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Figtree', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'] },
      colors: {
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        paper: 'rgb(var(--paper) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        brand: { DEFAULT: 'rgb(var(--brand) / <alpha-value>)', dark: 'rgb(var(--brand-dark) / <alpha-value>)', soft: 'rgb(var(--brand-soft) / <alpha-value>)' },
        saffron: { DEFAULT: '#E8A33D', soft: 'rgb(var(--saffron-soft) / <alpha-value>)' },
        side: { DEFAULT: 'rgb(var(--side) / <alpha-value>)', hover: 'rgb(var(--side-hover) / <alpha-value>)', text: 'rgb(var(--side-text) / <alpha-value>)' },
        ok: '#2F8F5B', warn: '#B7791F', bad: '#C2413B', info: '#2F6FB0',
      },
      boxShadow: { card: '0 1px 2px rgb(16 42 43 / 0.06), 0 0 0 1px rgb(16 42 43 / 0.05)', pop: '0 12px 32px -8px rgb(16 42 43 / 0.25)' },
    },
  },
  plugins: [],
};
