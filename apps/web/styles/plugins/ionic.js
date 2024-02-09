module.exports = ({ addUtilities, theme, matchUtilities, variants }) => {
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
    },
    { values: theme('spacing') },
  )


  addUtilities({
    [`.ion-modal-fill`]: {
      '--width': '100%',
      '--height': '100%',
    },
    [`.ion-modal-xs`]: {
      '--width': '250px',
      '--height': '250px',
    },
    [`.ion-modal-sm`]: {
      '--width': '400px',
      '--height': '400px',
    },
    [`.ion-modal-md`]: {
      '--width': '600px',
      '--height': '600px',
    },
    [`.ion-modal-lg`]: {
      '--width': '100%',
      '--height': '100%',
      '--max-width': 'calc(max(800px, min(1200px, 100% - 4rem)))',
      '--max-height': 'calc(max(600px, min(900px, 100% - 4rem)))',
    },

    [`.ion-modal-x-xs`]: {
      '--width': '250px',
    },
    [`.ion-modal-x-sm`]: {
      '--width': '400px',
    },
    [`.ion-modal-x-md`]: {
      '--width': '600px',
    },
    [`.ion-modal-x-lg`]: {
      '--width': '100%',
      '--max-width': 'calc(max(800px, min(1200px, 100% - 4rem)))',
    },

    [`.ion-modal-y-xs`]: {
      '--height': '250px',
    },
    [`.ion-modal-y-sm`]: {
      '--height': '400px',
    },
    [`.ion-modal-x-md`]: {
      '--height': '600px',
    },
    [`.ion-modal-y-lg`]: {
      '--height': '100%',
      '--max-height': 'calc(max(600px, min(900px, 100% - 4rem)))',
    },
  })

  const COLORS = {
    'base-100': '#222222',
    'base-200': '#191919',
    'base-300': '#111111',
    // primary: 'oklch(77.48% 0.204 60.62)',
    // 'primary-content': '#131616',
    // secondary: 'oklch(45.98% 0.248 305.03)',
    // 'secondary-content': '#E3C4FF',
    // accent: 'oklch(64.8% 0.223 136.07347934356451)',
    // 'accent-content': '#DCFFBB',
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
  }

  matchUtilities(
    {
      [`ion-color`]: (value) => {
        if (typeof value !== 'string') {
          return {}
        }
        if (!value.startsWith('#')) {
          return {}
        }
        return {
          '--ion-color-base': value,
          '--ion-color-base-rgb': hexToRgb(value),
        }
      },
      [`ion-contrast`]: (value) => {
        if (typeof value !== 'string') {
          return {}
        }
        if (!value.startsWith('#')) {
          return {}
        }
        return {
          '--ion-color-contrast': value,
          '--ion-color-contrast-rgb': hexToRgb(value),
        }
      },
    },
    { values: theme('colors') },
  )
  Object.entries(COLORS).forEach(([key, value]) => {
    addUtilities({
      [`.ion-color-${key}`]: {
        '--ion-color-base': value,
        '--ion-color-base-rgb': hexToRgb(value),
      },
      [`.ion-contrast-${key}`]: {
        '--ion-color-contrast': value,
        '--ion-color-contrast-rgb': hexToRgb(value),
      },
    })
  })


  //console.log(JSON.stringify(Object.keys(theme('')), null, 2))
  //console.log(theme('colors'))
}

function hexToRgb(hex) {
  hex = hex.replace('#', '')
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map(function (hex) {
        return hex + hex
      })
      .join('')
  }
  const bigint = parseInt(hex.replace('#', ''), 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `${r}, ${g}, ${b}`
}
