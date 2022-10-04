const env = require('./env')
const config = require('./electron-config.base.json')
const package = require('./package.json')

module.exports = {
  ...config,
  appId: env.NW_PTR ? `${package.name}-ptr` : package.name,
  productName: env.NW_PTR ? `${package.name}-ptr` : package.name,
  files: [
    ...config.files,
    `!dist/web/nw-data/${env.NW_PTR ? 'live' : 'ptr'}`,
  ],
}
