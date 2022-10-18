const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: ['./apps/web/**/*.{html,js,ts}'],
  theme: {
    extend: {
      screens: {
        '3xl': '1600px',
        '4xl': '2000px',
        '5xl': '2400px',
        '6xl': '3000px',
      },
      gridTemplateColumns: {
        'fill': 'repeat(auto-fill, minmax(20rem, 1fr))',
        'dl': 'max-content auto'
      }
    },
    fontFamily: {
      ...defaultTheme.fontFamily,
      serif: [
        '"New World"',
        ...defaultTheme.fontFamily.serif,
      ],
    },
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
  daisyui: {
    themes: [
      {
        nwbuddy: {
          ...require('daisyui/src/colors/themes')['[data-theme=halloween]'],
          '--nwb-description': '#e1cb99',
          '--nwb-rarity0': '#c8c8c8',
          //'--nwb-rarity1': '#07c02f',
          '--nwb-rarity1': '#2ae553',
          '--nwb-rarity2': '#00cbe9',
          //'--nwb-rarity3': '#ff16f7',
          '--nwb-rarity3': '#f93af9',
          //'--nwb-rarity4': '#f7a22d',
          '--nwb-rarity4': '#ffad2e',
        },
      },
    ],
  },
}
