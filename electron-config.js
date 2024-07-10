const config = require('./electron-config.base.json')

module.exports = {
  ...config,
  files: [
    ...config.files
  ]
}
