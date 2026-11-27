import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import sirv from 'sirv'

// The dev configurations don't copy these folders as build assets: angular would glob and watch them on every
// rebuild (nw-data has ~60k files), and the viewer lib changes while `pnpm viewer dev:lib` rebuilds it.
// Instead the dev server proxies them to static servers that run inside the `ng serve` process.
const nwDataServer = await startStaticServer(
  fs.realpathSync(path.resolve(import.meta.dirname, 'dist/nw-data/.current')),
)
// emptied and rewritten by every viewer rebuild, may not exist yet
const viewerLibServer = await startStaticServer(path.resolve(import.meta.dirname, 'apps/viewer/dist/lib'))

const nwCdnServer = await startStaticServer(fs.realpathSync(path.resolve(import.meta.dirname, 'dist/nw-cdn')))

// Without an agent the proxy opens a connection per request and closes it (`Connection: close`). The viewer streams
// thousands of files, the closed sockets wait in TIME_WAIT until Windows runs out of ports (ERR_ADDRESS_IN_USE,
// ERR_NO_BUFFER_SPACE in the browser)
const agent = new http.Agent({ keepAlive: true, maxSockets: 64, maxFreeSockets: 64 })

export default {
  '/nwbt': {
    target: 'http://127.0.0.1:8000',
    agent,
    secure: false,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/nwbt/, ''),
  },
  '/nw-data': {
    target: nwDataServer,
    agent,
    rewrite: (path) => path.replace(/^\/nw-data/, ''),
  },
  '/nw-cdn': {
    target: nwCdnServer,
    agent,
    rewrite: (path) => path.replace(/^\/nw-cdn/, ''),
  },
  '/viewer-lib': {
    target: viewerLibServer,
    agent,
    rewrite: (path) => path.replace(/^\/viewer-lib/, ''),
  },
}

async function startStaticServer(dir) {
  // dev: files are looked up per request, no upfront directory scan. etag: revalidated on every load (no-cache)
  const serve = sirv(dir, { dev: true, etag: true, extensions: [] })
  const server = http.createServer((req, res) => serve(req, res))
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  server.unref()
  return `http://127.0.0.1:${server.address().port}`
}
