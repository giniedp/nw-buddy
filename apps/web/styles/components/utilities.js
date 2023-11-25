module.exports = ({ addUtilities }) => {
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
}
