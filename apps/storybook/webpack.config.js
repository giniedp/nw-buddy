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
