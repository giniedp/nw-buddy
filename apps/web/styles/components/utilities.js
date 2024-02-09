module.exports = ({ addUtilities, theme, matchUtilities, variants }) => {
  addUtilities({
    '.content-auto': {
      'content-visibility': 'auto',
    },
    '.content-hidden': {
      'content-visibility': 'hidden',
    },
    '.content-visible': {
      'content-visibility': 'visible',
    },
  })

  matchUtilities(
    {
      [`grid-item-min-w`]: (value) => ({
        '--grid-item-min-w': value,
      }),
      [`grid-gap`]: (value) => ({
        '--grid-gap': value,
        'grid-gap': `var(--grid-gap)`,
      }),
    },
    { values: theme('spacing') },
  )

  matchUtilities(
    {
      [`grid-cols-max`]: (value) => ({
        [`--grid-column-count`]: `${value}`,
        [`--gap-count`]: `calc(var(--grid-column-count) - 1)`,
        [`--total-gap-width`]: `calc(var(--gap-count) * var(--grid-gap))`,
        [`--grid-item-max-w`]: `calc((100% - var(--total-gap-width)) / var(--grid-column-count))`,
        'grid-template-columns': `repeat(auto-fill, minmax(max(var(--grid-item-min-w), var(--grid-item-max-w)), 1fr))`,
      }),
    },
    { values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  )

  matchUtilities(
    {
      [`grid-auto-fill`]: (value) => {
        return {
          'grid-template-columns': `repeat(auto-fill, minmax(min(${value}, 100%), 1fr))`,
        }
      },
      [`grid-auto-fit`]: (value) => {
        return {
          'grid-template-columns': `repeat(auto-fit, minmax(min(${value}, 100%), 1fr))`,
        }
      },
    },
    { values: theme('maxWidth') },
  )
  // console.log(JSON.stringify(Object.keys(theme('')), null, 2))
}
