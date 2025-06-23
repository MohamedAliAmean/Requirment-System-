/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary-color)',
        secondary: 'var(--secondary-color)',
        accent: 'var(--accent-color)',
        'text-color': 'var(--text-color)',
        'background-color': 'var(--background-color)',
        'muted-color': 'var(--muted-color)',
        'card-background': 'var(--card-background)',
        'border-color': 'var(--border-color)',
      }
    },
  },
  plugins: [],
};
