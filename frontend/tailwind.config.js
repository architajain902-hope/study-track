/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'rgb(var(--brand) / <alpha-value>)',
          light: 'rgb(var(--brand-light) / <alpha-value>)',
          lighter: 'rgb(var(--brand-lighter) / <alpha-value>)',
          fade: 'rgb(var(--brand-fade) / <alpha-value>)',
        },
        white: 'rgb(var(--text) / <alpha-value>)',
        ink: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        "surface-light": 'rgb(var(--surface-light) / <alpha-value>)',
        "surface-dark": 'rgb(var(--surface-dark) / <alpha-value>)',
        bubble: {
          out: 'rgb(var(--bubble-out) / <alpha-value>)',
          in: 'rgb(var(--bubble-in) / <alpha-value>)',
          'out-text': 'rgb(var(--bubble-out-text) / <alpha-value>)',
          'in-text': 'rgb(var(--bubble-in-text) / <alpha-value>)',
        },
        accent: 'rgb(var(--accent) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        warn: 'rgb(var(--warn) / <alpha-value>)',
        muted: 'rgb(var(--text-muted) / <alpha-value>)',
        soft: 'rgb(var(--text-soft) / <alpha-value>)',
        body: 'rgb(var(--text-body) / <alpha-value>)',
        dim: 'rgb(var(--text-dim) / <alpha-value>)',
        onbrand: 'rgb(var(--on-brand) / <alpha-value>)',
        heat: 'rgb(var(--heat-empty) / <alpha-value>)',
        'warn-text': 'rgb(var(--warn-text) / <alpha-value>)',
        'warn-muted': 'rgb(var(--warn-muted) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      backgroundImage: {
        'chat-pattern': "var(--chat-pattern)",
      },
      boxShadow: {
        'bubble': 'var(--shadow-bubble)',
      },
    },
  },
  plugins: [],
};