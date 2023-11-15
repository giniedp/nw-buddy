import 'zone.js/node'

import compression from 'compression'
import express from 'express'
import { join } from 'node:path'

import { LRUCache } from 'lru-cache'
export * from '../web/main.server'

export interface AppOptions {
  host: string
  port: string
  publicDir: string
  storyDir: string
}
export function initServer({ host, port, publicDir, storyDir }: AppOptions) {
  const cache = new LRUCache({
    max: 1000,
  })
  const server = express()

  server.use(compression({}))
  server.use(express.json({}))

  server.get(
    '*.*',
    express.static(publicDir, {
      cacheControl: false,
      etag: true,
    })
  )

  server.get('*', (req, res, next) => {
    res.sendFile(join(publicDir, 'index.html'))
  })

  return server
}
