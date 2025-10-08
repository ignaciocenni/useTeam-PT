/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        'highlightMove': 'highlightMove 0.6s ease-out',
        'settleIn': 'settleIn 0.4s ease-out',
      },
    },
  },
  plugins: [],
};
