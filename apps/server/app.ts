import 'zone.js/node'

import compression from 'compression'
import { ngExpressEngine } from '@nguniversal/express-engine'
import { APP_BASE_HREF } from '@angular/common'
import express from 'express'
import { join } from 'path'
import { existsSync } from 'fs'

import { AppServerModule } from '../web/main.server'
import LRUCache from 'lru-cache'
export * from '../web/main.server'

export interface AppOptions {
  host: string
  port: string
  publicDir: string
  storyDir: string
}
export function app({ host, port, publicDir, storyDir }: AppOptions) {
  const cache = new LRUCache({
    max: 1000,
  })
  const server = express()
  const distFolder = publicDir
  const indexHtml = existsSync(join(distFolder, 'index.original.html')) ? 'index.original.html' : 'index'

  server.use(compression({}))
  server.use(express.json({}))

  // server.engine(
  //   'html',
  //   ngExpressEngine({
  //     bootstrap: AppServerModule,
  //   })
  // )

  // server.set('view engine', 'html')
  // server.set('views', distFolder)

  // Serve static files from /browser
  server.get(
    '*.*',
    express.static(distFolder, {
      cacheControl: false,
      // maxAge: '1y',
      // lastModified: true
      etag: true,
    })
  )


  // All regular routes use the Universal engine
  server.get('*', (req, res, next) => {
    // const key = req.url
    // if (cache.has(key)) {
    //   res.send(cache.get(key))
    //   return
    // }

    if (req.url === '/storybook') {
      res.redirect('/storybook/index.html')
      return
    }
    if (req.url.match(/^\/storybook\//)) {
      req.url = req.url.replace(/^\/storybook\//, '') || 'index.html'
      next()
      return
    }

    if (req.url.match(/^\/app\//)) {
      req.url = req.url.replace(/^\/app\//, '') || 'index.html'
      next()
      return
    }

    res.sendFile(join(distFolder, 'index.html'))
    // res.render(
    //   indexHtml,
    //   { req, providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }] },
    //   (err: Error, html: string) => {
    //     if (!err) {
    //       cache.set(key, html)
    //       res.send(html)
    //     } else {
    //       res.send('') // TODO: error page
    //     }
    //   }
    // )
  })

  if (storyDir) {
    server.get('*', express.static(storyDir))
  }

  return server
}
