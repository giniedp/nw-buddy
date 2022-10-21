import 'zone.js/node'

import { program } from 'commander'
import { isAbsolute, join } from 'path'
import { app } from './app'

program
  .version('0.0.0')
  .option('--host [host]', 'The listening hostname', 'localhost')
  .option('--port [port]', 'The listening port', process.env['PORT'] || '4200')
  .option('--dir [dir]', 'The public directory with angular app', join('..', 'web'))
  .option('--storybook [storybook]', 'The public directory with storybook app', join('..', 'storybook'))
  .parse(process.argv)

const options =
  program.opts<{
    dir: string
    storybook: string
    host: string
    port: string
  }>()

const publicDir = isAbsolute(options.dir) ? options.dir : join(__dirname, options.dir)
const storyDir = isAbsolute(options.storybook) ? options.storybook : join(__dirname, options.storybook)
const host = options.host
const port = options.port

function run() {
  let server = app({
    host: host,
    port: port,
    publicDir: publicDir,
    storyDir: storyDir,
  })
    .listen(Number(port), host, () => {
      console.log(`Server listening on http://${host}:${port} serving ${publicDir} and ${storyDir}`)
    })
    .on('close', () => {
      console.log('Server closed')
    })
    .on('error', (err) => {
      console.error('Server error:', err)
    })

  function close() {
    server?.close()
    server = null
  }
  process.on('SIGTERM', close)
  process.on('SIGINT', close)
}

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire
const mainModule = __non_webpack_require__.main
const moduleFilename = (mainModule && mainModule.filename) || ''
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  run()
}
