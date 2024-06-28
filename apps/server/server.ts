import compression from 'compression'
import express from 'express'

import { APP_BASE_HREF } from '@angular/common'
import { CommonEngine } from '@angular/ssr'
import { join } from 'node:path'
import { LRUCache } from 'lru-cache'
import bootstrap from '../web/main.server'

export interface AppOptions {
  host: string
  port: string
  publicDir: string
}
export function server({ host, port, publicDir }: AppOptions) {
  const cache = new LRUCache({
    max: 1000,
  })
  const server = express()
  const commonEngine = new CommonEngine()
  const indexHtml = join(publicDir, 'index.server.html')

  server.use(compression({}))
  server.use(express.json({}))

  server.get(
    '*',
    express.static(publicDir, {
      cacheControl: false,
      etag: true,
    })
  )

  server.get('*', (req, res, next) => {
    console.log('GET', req.url)
    const { protocol, originalUrl, baseUrl, headers } = req
    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: publicDir,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err))
  })

  return server
}
