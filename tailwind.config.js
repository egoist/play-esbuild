/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: false, // or 'media' or 'class'
  content: ["./src/**/*.vue"],
  theme: {
    extend: {
      height: {
        header: "44px",
        main: "calc(100vh - 44px)",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
