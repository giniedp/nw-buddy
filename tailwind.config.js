module.exports = {
  content: [
    "./apps/web/**/*.{html,js,ts}"
  ],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography"), require('daisyui')],
  daisyui: {
    themes: ["halloween"],
  },
}
