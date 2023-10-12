//Polyfill Node.js core modules in Webpack. This module is only needed for webpack 5+.
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const webpack = require('webpack')
const { PACKAGE_VERSION, COMMIT_HASH, NW_USE_PTR, CDN_URL, environment } = require('./env')
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')
const EmitFilePlugin = require('emit-file-webpack-plugin')
/**
 * Custom angular webpack configuration
 */
module.exports = (config, options) => {
  config.module.noParse = [require.resolve('typescript/lib/typescript.js')]
  if (options && options.fileReplacements) {
    for (let replacement of options.fileReplacements) {
      let parts = replacement.with.split('.')
      if (parts.includes('electron')) {
        config.target = 'electron-renderer'
      }
      break
    }
  }

  const VERSION = PACKAGE_VERSION + '#' + COMMIT_HASH
  console.log('\n')
  console.log('[WEBPACK]', config.target)
  console.log('  version', VERSION)
  console.log('    isPtr', !!NW_USE_PTR)
  console.log('   assets', config.output.publicPath)
  console.log('\n')

  const definitions = {
    __NWB_VERSION__: JSON.stringify(VERSION),
    __NWB_COMMIT__: JSON.stringify(COMMIT_HASH),
    __NWB_USE_PTR__: JSON.stringify(NW_USE_PTR),
    __NWB_DATA_PATH__: JSON.stringify(environment.dataDir(NW_USE_PTR)),
    __NWB_CDN_URL__: JSON.stringify(CDN_URL),
    __NWB_DEPLOY_URL__: JSON.stringify(config.output.publicPath || '/'),
  }
  config.module.rules.push(
    {
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
    },
    {
      test: /\.ttf$/,
      use: ['file-loader'],
    }
  )

  config.plugins = [
    ...config.plugins,
    new NodePolyfillPlugin({
      excludeAliases: ['console'],
    }),
    new webpack.DefinePlugin(definitions),
    new MonacoWebpackPlugin({
      languages: ['json', 'typescript', 'javascript'],
    }),
    new EmitFilePlugin({
      // OPTIONAL: defaults to the Webpack output path.
      // Output path.
      // Can be relative (to Webpack output path) or absolute.
      path: `.`,

      // REQUIRED.
      // Name of the file to add to assets.
      // If hash option is enabled add `[hash]` here to choose where to insert the compilation hash.
      // See the hash option for more information.
      filename: `version`,

      // REQUIRED.
      // File content. Can be either a string, a buffer, or a (asynchronous) function.
      // If the resulting object is not a string or a buffer, it will be converted
      // to string via `.toString` (if the function was overridden) or `JSON.stringify`.
      content: VERSION,

      // OPTIONAL: defaults to the webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL.
      // Asset processing stage.
      // https://webpack.js.org/api/compilation-hooks/#processassets
      stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,

      // OPTIONAL: defaults to false.
      // Adds the compilation hash to the filename. You can either choose within the filename
      // where the hash is inserted by adding `[hash]` i.e. `test.[hash].js` or the hash will be
      // appended to the end of the file i.e. `test.js?hash`.
      hash: false,
    }),
  ]

  return config
}
