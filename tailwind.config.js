/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        hind: ['Hind Siliguri', 'sans-serif'],
        syne: ['Syne', 'sans-serif'],
      },
      colors: {
        primary: '#0F4C81',
        'primary-light': '#2E86DE',
        accent: '#F0A500',
        success: '#0BAA69',
        danger: '#E63946',
      },
    },
  },
  plugins: [],
};
