const env = require('./env')
const config = require('./electron-config.base.json')

module.exports = {
  ...config,
  files: [
    ...config.files,
    `!dist/web-electron/browser/nw-data/${env.NW_USE_PTR ? 'live' : 'ptr'}`,
  ]
}
