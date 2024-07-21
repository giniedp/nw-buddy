import compression from 'compression'
import express from 'express'

import fs from 'node:fs'
import bootstrap from '../web/main.server'
import { ssrAngular } from './middleware/ssr-angular'
import { ssrCache } from './middleware/ssr-cache'

export interface AppOptions {
  publicDir: string
  indexHtml: string
}
export function app({ publicDir, indexHtml }: AppOptions) {
  const server = express()

  server.use(compression({}))
  server.use(express.json({}))

  server.get(
    '*',
    express.static(publicDir, {
      etag: true,
      index: false,
      cacheControl: false,
      setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'no-cache')
      },
    }),
  )

  server.get(
    '*',
    ssrCache(),
    ssrAngular({
      bootstrap,
      documentFilePath: indexHtml,
      publicPath: publicDir,
    }),
  )

  return server
}

function mergeResponse(indexHtmlPath: string, responseHtml: string) {
  if (typeof responseHtml !== 'string') {
    return responseHtml
  }
  const regex = /<head[^>]*>[\s\S]*?<\/head>/i
  const headHtml = responseHtml.match(regex)?.[0]
  if (!headHtml) {
    return responseHtml
  }
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8')
  return indexHtml.replace(regex, headHtml)
}
