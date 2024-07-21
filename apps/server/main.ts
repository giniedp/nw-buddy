import { program } from 'commander'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { app as appServer } from './app'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const optionsSchema = z.object({
  dir: z.string(),
  host: z.string(),
  port: z.string(),
  ssr: z.boolean(),
})

program
  .version('0.0.0')
  .option('--host [host]', 'The listening hostname', '0.0.0.0')
  .option('--port [port]', 'The listening port', process.env['PORT'] || '4200')
  .option('--dir [dir]', 'The public directory with angular app', join('..', 'browser'))
  .option('--ssr', 'Enables server side rendering (SEO tags only)', false)
  .parse(process.argv)

const options = optionsSchema.parse(program.opts())
console.log(options)

const serverDistFolder = dirname(fileURLToPath(import.meta.url))
const publicDir = isAbsolute(options.dir) ? options.dir : resolve(serverDistFolder, options.dir)
const indexHtml = join(serverDistFolder, 'index.server.html')
const host = options.host
const port = options.port

function run() {
  let server = appServer({
    publicDir: publicDir,
    indexHtml: indexHtml,
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
