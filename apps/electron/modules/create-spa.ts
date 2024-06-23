import { BrowserWindow, app, net, protocol, session } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

export interface ServeAppOptions {
  directory: string
  file?: string
  hostname?: string
  isCorsEnabled?: boolean
  partition?: string
  scheme?: string
}
export function createSpa(options: ServeAppOptions) {
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

  const publicDir = path.resolve(app.getAppPath(), options.directory)
  const indexHtml = path.join(publicDir, options.file)
  async function handler(request: Request): Promise<Response> {
    const pathname = path
      .normalize(new URL(request.url).pathname)
      .replace(/\\/gi, '/')
      .replace(/(\.\.\/)+/gi, '')
    const filePath = path.join(publicDir, pathname)
    const stat = fs.existsSync(filePath) ? fs.statSync(filePath) : null
    if (stat?.isFile()) {
      return net.fetch(`file://${filePath}`)
    }
    if (fs.existsSync(filePath + options.file)) {
      return net.fetch(`file://${filePath + options.file}`)
    }
    return net.fetch(`file://${indexHtml}`)
  }

  protocol.registerSchemesAsPrivileged([
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

  app.on('ready', () => {
    const currentSession = options.partition ? session.fromPartition(options.partition) : session.defaultSession
    currentSession.protocol.handle(options.scheme, handler)
  })

  return async (window: BrowserWindow, opts: {
    path?: string
    query?: string | Record<string, string>
  }) => {
    let url = `${options.scheme}://${options.hostname}`
    if (opts.path) {
      url += opts.path
    }
    if (opts.query) {
      url += '?' + new URLSearchParams(opts.query).toString()
    }
    await window.loadURL(url)
  }
}
