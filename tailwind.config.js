const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: ['./apps/web/**/*.{html,js,ts}'],
  theme: {
    screens: {
      'xs': '0px',
      'sm': '576px',
      'md': '768px',
      'lg': '992px',
      'xl': '1200px',
      '2xl': '1400px',
      '3xl': '1600px',
      '4xl': '2000px',
      '5xl': '2400px',
      '6xl': '3000px',
    },
    extend: {
      gridTemplateColumns: {
        'fill': 'repeat(auto-fill, minmax(20rem, 1fr))',
        'dl': 'max-content auto'
      },
      colors: {
        nw: {
          success: '#69a762',
          warning: '#e47f35',
          danger: '#eb5050',
          description: '#e1cb99'
        },
        rarity: {
          '1': '#c8c8c8',
          '1': '#07c02f',
          '2': '#00cbe9',
          '3': '#ff16f7',
          '4': '#f7a22d',
        },
        syndicate: {
          light: '#8732d3',
          mid: '#6e28ad',
          dark: '#551f85',
        },
        marauder: {
          light: '#149633',
          mid: '#097122',
          dark: '#093e16',
        },
        covenant: {
          light: '#eb9f0d',
          mid: '#b47c12',
          dark: '#895f0d',
        },
        attr: {
          base: '#4CB1FC',
          buff: '#B150E6',
          assign: '#F5D15E'
        }
      },
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
          "base-100": '#212121',
          "base-200": '#1D1D1D',
          "base-300": '#181818'
        },
      },
    ],
  },
}
