import type { Request, Response, RequestHandler } from 'express'
import { LRUCache } from 'lru-cache'

export interface SsrCacheOptions {
  cache?: LRUCache<string, any>
  cacheKey?: (req: Request) => string
  transform?: (body: string) => string
}

export const ssrCache = (options?: SsrCacheOptions): RequestHandler => {
  const cache =
    options?.cache ||
    new LRUCache({
      max: 10000,
      allowStale: true,
      updateAgeOnGet: false,
      updateAgeOnHas: false,
    })
  const cacheKey = options?.cacheKey || getCacheKey
  const transform = options?.transform || ((body) => body)

  return (req, res, next) => {
    if (req.query?.['ssr-cache-prune']) {
      cache.clear()
    }
    const key = cacheKey(req)
    if (!key) {
      res.set('X-SSR-CACHE', 'SKIP')
      return next()
    }
    if (cache.has(key)) {
      const { status, body } = decodeResult(cache.get(key))
      res.set('X-SSR-CACHE', 'HIT')
      res.status(status)
      res.setHeader('Cache-Control', 'no-cache')
      res.send(body)
    } else {
      res.set('X-SSR-CACHE', 'MISS')
      res.setHeader('Cache-Control', 'no-cache')
      captureSend(res, (body) => {
        cache.set(key, encodeResult(res.statusCode, transform(body)))
      })
      next()
    }
  }
}

function captureSend(res: Response, fn: (body: any) => void) {
  const send = res.send
  res.send = (body) => {
    fn(body)
    return send.call(res, body)
  }
}

function encodeResult(statusCode: number, html: string) {
  return {
    status: statusCode,
    body: html,
  }
}

function decodeResult(result: any) {
  return {
    status: result.status,
    body: result.body,
  }
}

function getCacheKey(req: Request) {
  try {
    const url = new URL(req.url, 'http://localhost')
    return url.pathname
  } catch (e) {
    console.error(e)
    return req.url
  }
}
