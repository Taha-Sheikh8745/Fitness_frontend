/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          start: '#021B32',
          end: '#0A2740',
        },
        accent: {
          DEFAULT: '#00E6FF',
          hover: '#00B3CC',
        },
        surface: 'rgba(255, 255, 255, 0.05)',
        surfaceHover: 'rgba(255, 255, 255, 0.1)',
        textMain: '#FFFFFF',
        textMuted: '#9CA3AF'
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #021B32 0%, #0A2740 100%)',
      }
    },
  },
  plugins: [],
}
