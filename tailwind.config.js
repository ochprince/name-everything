/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1a1a1a',
        paper: '#f7f4ef',
        accent: '#0f6b5c',
        muted: '#6b6560',
        danger: '#8b3a3a',
      },
    },
  },
  plugins: [],
}
