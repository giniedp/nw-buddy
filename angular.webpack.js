//Polyfill Node.js core modules in Webpack. This module is only needed for webpack 5+.
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const webpack = require('webpack')
const env = require('./env')

/**
 * Custom angular webpack configuration
 */
module.exports = (config, options) => {
  if (options.fileReplacements) {
    for (let replacement of options.fileReplacements) {
      let parts = replacement.with.split('.')
      if (parts.includes('electron')) {
        config.target = 'electron-renderer'
      }
      break
    }
  }

  config.plugins = [
    ...config.plugins,
    new NodePolyfillPlugin({
      excludeAliases: ['console'],
    }),
    new webpack.DefinePlugin({
      __VERSION__: JSON.stringify(require('./package.json').version),
      __NW_PTR__: JSON.stringify(env.NW_PTR)
   })
  ]

  console.log('[WEBPACK] using target', config.target)
  return config
}
