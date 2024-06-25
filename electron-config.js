const config = require('./electron-config.base.json')

module.exports = {
  ...config,
  files: [
    ...config.files,
    "!dist/web-electron/browser/**/worldtiles/**/*",
    "!dist/web-electron/browser/**/items_hires/**/*"
  ]
}
