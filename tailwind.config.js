module.exports = {
  content: ['./apps/web/**/*.{html,js,ts}'],
  theme: {
    extend: {},
    fontFamily: {
      sans: [
        // Safari for OS X and iOS (San Francisco)
        '-apple-system',
        // Windows
        'Segoe UI',
        // Android
        'Roboto',
        // Basic web fallback
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        // Emoji fonts
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
      ],
      serif: [
        '"New World"',
        // Safari for OS X and iOS (San Francisco)
        '-apple-system',
        // Windows
        'Segoe UI',
        // Android
        'Roboto',
        // Basic web fallback
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        // Emoji fonts
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
      ],
    },
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
  daisyui: {
    themes: [
      {
        nwbuddy: {
          ...require('daisyui/src/colors/themes')['[data-theme=halloween]'],
          '--nwb-rarity0': '#c8c8c8',
          '--nwb-rarity1': '#07c02f',
          '--nwb-rarity2': '#00cbe9',
          '--nwb-rarity3': '#ff16f7',
          '--nwb-rarity4': '#f7a22d',
        },
      },
    ],
  },
}
