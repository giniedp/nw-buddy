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
  return config
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
