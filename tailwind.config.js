/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#33618D',
        secondary: '#F3732A',
        neutral: '#000000',
        success: '#49AF2F',
        caution: '#EDCA04',
        danger: '#D1170F',
        info: '#02A8E0',
        container: '#001D35',
      },

      fontFamily: {
        'lexend-black': ['Lexend-Black', 'sans-serif'],
        'lexend-light': ['Lexend-Light', 'sans-serif'],
        'lexend-medium': ['Lexend-Medium', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

