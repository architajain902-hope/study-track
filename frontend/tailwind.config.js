/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#075E54',
          light: '#128C7E',
          lighter: '#25D366',
          fade: '#DCF8C6',
        },
        ink: '#0B141A',
        surface: '#202C33',
        "surface-light": '#2A3942',
        "surface-dark": '#111B21',
        bubble: {
          out: '#005C4B',
          in: '#202C33',
        },
        accent: '#00A884',
        danger: '#F15C6D',
        warn: '#FFBE5C',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      backgroundImage: {
        'chat-pattern':
          "url(\"data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23263643' stroke-width='1' opacity='0.35'%3E%3Ccircle cx='15' cy='15' r='6'/%3E%3Cpath d='M15 25v80M25 15h80M15 100l85-85M25 105l80-80'/%3E%3Ccircle cx='105' cy='105' r='6'/%3E%3Cpath d='M15 60h90M60 15v90'/%3E%3C/g%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'bubble': '0 1px 0.5px rgba(11,20,26,0.13)',
      },
    },
  },
  plugins: [],
};