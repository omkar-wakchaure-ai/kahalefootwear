/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f9fafb',
          100: '#f3f4f6',
          900: '#111827',
        },
      },
      fontFamily: {
        script: ['"Dancing Script"', 'cursive'],
      },
    },
  },
  plugins: [],
};