/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EAF1FB',
          100: '#C5D8F4',
          200: '#9FBFED',
          300: '#7AA5E6',
          400: '#548CDD',
          500: '#2B5FC2',
          600: '#234D9E',
          700: '#1B3B7A',
          800: '#122956',
          900: '#0A1732',
        },
      },
    },
  },
  plugins: [],
}
