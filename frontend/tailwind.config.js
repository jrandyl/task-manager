/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['"Poppins"', "sans-serif"],
        urbanist: ['"Urbanist"', "sans-serif"],
        alex: ['"Alex Brush"', "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#000722", // this maps to `primary`
        },
        secondary: {
          DEFAULT: "#000722e6", // this maps to `primary`
        },
      },
    },
  },
  plugins: [],
};
