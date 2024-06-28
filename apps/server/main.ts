import { program } from 'commander'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { server as appServer } from './server'
import { fileURLToPath } from 'node:url'

program
  .version('0.0.0')
  .option('--host [host]', 'The listening hostname', '0.0.0.0')
  .option('--port [port]', 'The listening port', process.env['PORT'] || '4200')
  .option('--dir [dir]', 'The public directory with angular app', join('..', 'browser'))
  .parse(process.argv)

const options =
  program.opts<{
    dir: string
    storybook: string
    host: string
    port: string
  }>()

const serverDistFolder = dirname(fileURLToPath(import.meta.url))
const publicDir = isAbsolute(options.dir) ? options.dir : resolve(serverDistFolder, options.dir)
const host = options.host
const port = options.port

function run() {
  let server = appServer({
    host: host,
    port: port,
    publicDir: publicDir,
  })
    .listen(Number(port), host, () => {
      console.log(`Server listening on http://${host}:${port} serving ${publicDir}`)
    })
    .on('close', () => {
      console.log('Server closed')
    })
    .on('error', (err: Error) => {
      console.error('Server error:', err)
    })

  function close() {
    server?.close()
    server = null
  }
  process.on('SIGTERM', close)
  process.on('SIGINT', close)
}

run()
