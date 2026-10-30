/** @type {import('tailwindcss').Config} */
const nativewindPreset = require('nativewind/preset');

module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [nativewindPreset],
  theme: {
    extend: {
      colors: {
        charcoal: {
          50: '#f6f7f8',
          100: '#eceef1',
          200: '#d5d9e0',
          300: '#b0b8c5',
          400: '#8492a6',
          500: '#65748b',
          600: '#515d70',
          700: '#414a59',
          800: '#2e3340',
          900: '#1a1d25',
          950: '#0f1115',
        },
        accent: {
          50: '#fff8ed',
          100: '#ffefd4',
          200: '#ffdca8',
          300: '#ffc270',
          400: '#ff9b3a',
          500: '#ff7d12',
          600: '#f05f08',
          700: '#c74708',
          800: '#9e380f',
          900: '#7f3010',
          950: '#451506',
        },
        electric: {
          50: '#eff6ff',
          100: '#d9e7ff',
          200: '#bcd5ff',
          300: '#8ebaff',
          400: '#5993ff',
          500: '#326bff',
          600: '#1d48f5',
          700: '#1736db',
          800: '#1a31b0',
          900: '#1c2f8a',
          950: '#161e52',
        },
      },
    },
  },
  plugins: [],
};
