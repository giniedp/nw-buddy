const env = require('./env')
const config = require('./electron-config.base.json')

module.exports = {
  ...config,
  files: [
    ...config.files,
    `!dist/web/nw-data/${env.NW_PTR ? 'live' : 'ptr'}`,
  ]
}
