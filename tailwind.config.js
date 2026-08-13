/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cyc: '#05060a',
        cobalt: '#1e3a8a',
        rose: '#e8a598',
        day: '#f4f1ea',
        ink: '#05060a',
      },
      fontFamily: {
        cue: [
          '"Big Shoulders Text"',
          '"Noto Sans SC"',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
