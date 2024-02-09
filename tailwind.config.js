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
      flex: {
        2: '2 2 0%',
        3: '3 3 0%',
        4: '4 4 0%',
        5: '5 5 0%',
      },
      animation: {
        'spin-cw': 'spin-cw 100s linear infinite',
        'spin-ccw': 'spin-ccw 100s linear infinite',
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
        'fill-3lg': 'repeat(auto-fill, minmax(40rem, 1fr))',
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
          common: '#666666',
          uncommon: '#00ab1a',
          rare: '#31bdeb',
          epic: '#e600de',
          legendary: '#ffa535',
          artifact: '#b42e0a',
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
          base: '#36b6eb',
          buff: '#a65ace',
          assign: '#ffdb7a',
          magnify: '#b42e0a',
        },
      },
    },
    fontFamily: {
      ...defaultTheme.fontFamily,
      serif: ['"New-World"', ...defaultTheme.fontFamily.serif],
      caslon: ['"Caslon-Antique"', ...defaultTheme.fontFamily.serif],
      nimbus: ['"Nimbus"', ...defaultTheme.fontFamily.sans],
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'),
    require('daisyui'),
    require('./apps/web/styles/components/nw-item'),
    require('./apps/web/styles/components/utilities'),
    require('./apps/web/styles/plugins/ionic'),
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          'text-shadow': (value) => ({
            textShadow: value,
          }),
        },
        { values: theme('textShadow') },
      )
    }),
  ],
  daisyui: {
    themes: [
      {
        nwbuddy: {
          'color-scheme': 'dark',
          'base-100': '#222222',
          'base-200': '#191919',
          'base-300': '#111111',
          primary: 'oklch(77.48% 0.204 60.62)',
          'primary-content': '#131616',
          secondary: 'oklch(45.98% 0.248 305.03)',
          'secondary-content': '#E3C4FF',
          accent: 'oklch(64.8% 0.223 136.07347934356451)',
          'accent-content': '#DCFFBB',
          neutral: '#1B1D1D',
          'neutral-content': '#CFD4D4',
          info: '#2563EB',
          'info-content': '#CFDEFF',
          success: '#16A34A',
          'success-content': '#BEFFD6',
          warning: '#D97706',
          'warning-content': '#2D1800',
          error: '#DC2626',
          'error-content': '#FFCDCD',
        },
      },
    ],
  },
}
