module.exports = ({ addUtilities, theme, variants }) => {
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

  const ionUtils = {}
  Object.entries(theme('spacing')).forEach(([key, value]) => {
    if (key.includes('.')) {
      key = key.replace('.', '\\.')
    }

    Object.assign(ionUtils, {
      [`.ion-p-${key}`]: {
        '--padding-start': value,
        '--padding-end': value,
        '--padding-top': value,
        '--padding-bottom': value,
      },
      [`.ion-px-${key}`]: {
        '--padding-start': value,
        '--padding-end': value,
      },
      [`.ion-py-${key}`]: {
        '--padding-top': value,
        '--padding-bottom': value,
      },

      [`.ion-m-${key}`]: {
        '--margin-start': value,
        '--margin-end': value,
        '--margin-top': value,
        '--margin-bottom': value,
      },
      [`.ion-mx-${key}`]: {
        '--margin-start': value,
        '--margin-end': value,
      },
      [`.ion-my-${key}`]: {
        '--margin-top': value,
        '--margin-bottom': value,
      },
    })
  })

  addUtilities(ionUtils)
}
