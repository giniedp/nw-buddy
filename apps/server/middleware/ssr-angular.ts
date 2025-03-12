import { APP_BASE_HREF } from '@angular/common'
import { CommonEngine, CommonEngineRenderOptions } from '@angular/ssr/node'
import type { RequestHandler } from 'express'

export const ssrAngular = (options: CommonEngineRenderOptions): RequestHandler => {
  const commonEngine = new CommonEngine()

  return (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req
    console.log("SSR Angular")
    commonEngine
      .render({
        ...options,
        url: options.url || `${protocol}://${headers.host}${originalUrl}`,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => {
        console.log("send HTML")
        return res.send(html)
      })
      .catch((err) => next(err))
  }
}
