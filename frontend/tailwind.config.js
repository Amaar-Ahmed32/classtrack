/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 600: '#0d9488', 700: '#0f766e' }, // teal — readable on white in bright classrooms
      },
    },
  },
  plugins: [],
};
