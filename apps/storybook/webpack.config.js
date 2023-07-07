const angularWebpack = require('../../angular.webpack')
const path = require('path')

class IgnoreNotFoundExportPlugin {
  apply(compiler) {
    const messageRegExp = /export '.*'( \(imported as '.*'\))? was not found in/
    compiler.hooks.done.tap('IgnoreNotFoundExportPlugin', (stats) => {
      stats.compilation.warnings = stats.compilation.warnings.filter((warn) => {
        return warn.constructor.name === 'ModuleDependencyWarning' && !messageRegExp.test(warn.message)
      })
    })
  }
}

module.exports = async ({ config, mode }) => {
  config.plugins.push(new IgnoreNotFoundExportPlugin())
  patchSvgLoader(config)
  coverageInstrument(config)
  return angularWebpack(config)
}

function patchSvgLoader(config) {
  const rule = config.module.rules.find(({ test, type }) => type === 'asset/resource' && test.test('.svg'))
  rule.test = /\.(ico|jpg|jpeg|png|apng|gif|eot|otf|webp|ttf|woff|woff2|cur|ani|pdf)(\?.*)?$/
}

function coverageInstrument(config) {
  const rules = config.module?.rules || []
  rules.push({
    test: /\.(js|ts)$/,
    loader: '@jsdevtools/coverage-istanbul-loader',
    enforce: 'post',
    include: path.join(process.cwd(), 'apps', 'web', 'src'),
    exclude: [/\.(e2e|spec|stories)\.ts$/, /node_modules/, /(ngfactory|ngstyle)\.js/, /polyfills.ts/],
  })

  config.module = config.module || {}
  config.module.rules = rules
}
