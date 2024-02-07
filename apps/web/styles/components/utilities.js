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

  addUtilities({
    [`.ion-modal-full`]: {
      '--width': '100%',
      '--height': '100%',
    },
    [`.ion-modal-md`]: {
      '--width': '100%',
      '--height': '100%',
      '--max-height': 'calc(max(600px, min(900px, 100% - 4rem)))',
      '--max-width': 'calc(max(800px, min(1200px, 100% - 4rem)))',
    },
  })

  matchUtilities(
    {
      [`ion-p`]: (value) => ({
        '--padding-start': value,
        '--padding-end': value,
        '--padding-top': value,
        '--padding-bottom': value,
      }),
      [`ion-px`]: (value) => ({
        '--padding-start': value,
        '--padding-end': value,
      }),
      [`ion-py`]: (value) => ({
        '--padding-top': value,
        '--padding-bottom': value,
      }),

      [`ion-m`]: (value) => ({
        '--margin-start': value,
        '--margin-end': value,
        '--margin-top': value,
        '--margin-bottom': value,
      }),
      [`ion-mx`]: (value) => ({
        '--margin-start': value,
        '--margin-end': value,
      }),
      [`ion-my`]: (value) => ({
        '--margin-top': value,
        '--margin-bottom': value,
      }),

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
