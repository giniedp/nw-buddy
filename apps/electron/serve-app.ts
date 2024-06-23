import electron, { BrowserWindow, net } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'

export interface ServeAppOptions {
  directory: string
  file?: string
  hostname?: string
  isCorsEnabled?: boolean
  partition?: string
  scheme?: string
}
export default function serveApp(options: ServeAppOptions) {
  options = {
    isCorsEnabled: true,
    scheme: 'app',
    hostname: '-',
    file: 'index.html',
    ...options,
  }

  if (!options.directory) {
    throw new Error('The `directory` option is required')
  }

  const publicDir = path.resolve(electron.app.getAppPath(), options.directory)

  async function handler(request: Request): Promise<Response> {
    const requestPath = decodeURIComponent(new URL(request.url).pathname)
    const filePath = path.join(publicDir, requestPath)
    const stat = await fs.stat(filePath)
    if (stat.isFile()) {
      return net.fetch(`file://${filePath}`)
    }
    if (stat.isDirectory()) {
      return net.fetch(`file://${filePath}/${options.file}`)
    }
    return new Response('Not found', { status: 404 })
  }

  electron.protocol.registerSchemesAsPrivileged([
    {
      scheme: options.scheme,
      privileges: {
        standard: true,
        secure: true,
        allowServiceWorkers: true,
        supportFetchAPI: true,
        corsEnabled: options.isCorsEnabled,
      },
    },
  ])

  electron.app.on('ready', () => {
    const session = options.partition
      ? electron.session.fromPartition(options.partition)
      : electron.session.defaultSession

    session.protocol.handle(options.scheme, handler)
  })

  return async (window: BrowserWindow, searchParameters: string | Record<string, string>) => {
    const queryString = searchParameters ? '?' + new URLSearchParams(searchParameters).toString() : ''
    await window.loadURL(`${options.scheme}://${options.hostname}${queryString}`)
  }
}
