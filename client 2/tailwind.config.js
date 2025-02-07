/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors : {
        "primary-200" : "#064c4f",
        "primary-100" : "#064c4f",
        "secondary-200" : "#00b050",
        "secondary-100" : "#0b1a78"
      }
    },
  },
  plugins: [],
}

