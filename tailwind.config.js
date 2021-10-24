module.exports = {
  mode: "jit",
  purge: ["./src/**/*.vue"],
  darkMode: false, // or 'media' or 'class'
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
