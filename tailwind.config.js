const defaultTheme = require('tailwindcss/defaultTheme')
const plugin = require('tailwindcss/plugin')

module.exports = {
  content: ['./apps/web/**/*.{html,js,ts}'],
  theme: {
    screens: {
      xs: '0px',
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px',
      '2xl': '1400px',
      '3xl': '1600px',
      '4xl': '2000px',
      '5xl': '2400px',
      '6xl': '3000px',
    },
    extend: {
      animation: {
        'spin-cw': 'spin-cw 3s linear infinite',
        'spin-ccw': 'spin-ccw 3s linear infinite',
      },
      keyframes: {
        'spin-cw': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'spin-ccw': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(-360deg)' },
        },
      },
      textShadow: {
        none: 'none',
        sm: '1px 1px 2px var(--tw-shadow-color)',
        DEFAULT: '2px 2px 4px var(--tw-shadow-color)',
        lg: '3px 8px 16px var(--tw-shadow-color)',
      },
      gridTemplateColumns: {
        'fill-5xs': 'repeat(auto-fill, minmax(4rem, 1fr))',
        'fill-4xs': 'repeat(auto-fill, minmax(6rem, 1fr))',
        'fill-3xs': 'repeat(auto-fill, minmax(8rem, 1fr))',
        'fill-2xs': 'repeat(auto-fill, minmax(10rem, 1fr))',
        'fill-xs': 'repeat(auto-fill, minmax(15rem, 1fr))',
        'fill-sm': 'repeat(auto-fill, minmax(20rem, 1fr))',
        fill: 'repeat(auto-fill, minmax(25rem, 1fr))',
        'fill-lg': 'repeat(auto-fill, minmax(30rem, 1fr))',
        'fill-2lg': 'repeat(auto-fill, minmax(35rem, 1fr))',
        dl: 'max-content auto',
        dl2: 'repeat(2, max-content) auto',
        dl3: 'repeat(3, max-content) auto',
      },
      colors: {
        nw: {
          success: '#69a762',
          warning: '#e47f35',
          danger: '#eb5050',
          description: '#e1cb99',
        },
        rarity: {
          common: '#c8c8c8',
          uncommon: '#07c02f',
          rare: '#00cbe9',
          epic: '#ff16f7',
          legendary: '#f7a22d',
          artifact: '#991d14',
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
          assign: '#F5D15E',
          magnify: '#991d14',
        },
      },
    },
    fontFamily: {
      ...defaultTheme.fontFamily,
      serif: ['"New World"', ...defaultTheme.fontFamily.serif],
      caslon: ['"Caslon-Antique"', ...defaultTheme.fontFamily.serif],
      nimbus: ['"Nimbus"', ...defaultTheme.fontFamily.sans],
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('daisyui'),
    require('./apps/web/styles/components/nw-item'),
    require('./apps/web/styles/components/utilities'),
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          'text-shadow': (value) => ({
            textShadow: value,
          }),
        },
        { values: theme('textShadow') }
      )
    }),
  ],
  daisyui: {
    themes: [
      {
        nwbuddy: {
          ...require('daisyui/src/colors/themes')['[data-theme=halloween]'],
          'base-100': '#222222',
          'base-200': '#191919',
          'base-300': '#111111',
        },
      },
    ],
  },
}
