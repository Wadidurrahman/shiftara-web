/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1e3a8a",   
        secondary: "#d4af37",  
      },
    },
  },
  plugins: [],
}