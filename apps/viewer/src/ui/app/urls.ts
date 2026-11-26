import type { ViewerApp } from './ViewerApp'

/**
 * Encodes a value as one path segment of the app's urls: `encodeURIComponent` plus the parentheses. Embedded in
 * nw-buddy, the Angular router rewrites the url on back and forward and reads `(…)` as an auxiliary outlet, which
 * cuts the path (`/pak/data/Foo(1)` becomes `/pak/data/Foo`).
 *
 * @remarks
 * File paths never go into the path: a last segment that looks like a file name makes file servers answer it as a
 * file instead of the app.
 */
export function pathSegment(value: string) {
  return encodeURIComponent(value).replace(/\(/g, '%28').replace(/\)/g, '%29')
}

/**
 * The Data tool showing a family, and a row of it by its key.
 *
 * @remarks
 * Relative to the router base, for `A` and `navigate`, which add the base. The app is mounted at different bases:
 * the root of the origin standalone (dev server, nwbt zip), `/pak` in nw-buddy (`/de-de/pak` with a locale, see
 * {@link ViewerApp.base}). Never build an href with the base by hand.
 */
export function dataHref(family: string, key?: string | null) {
  const path = `/data/${pathSegment(family)}`
  return key ? `${path}?key=${encodeURIComponent(key)}` : path
}

/**
 * The Browser tool showing a file (opens or activates its tab). Relative to the router base, see {@link dataHref}.
 * The file stays in the query, see {@link pathSegment}.
 */
export function browserHref(file: string) {
  return `/browser?file=${encodeURIComponent(file)}`
}

/**
 * The value of a route param: the router hands them over as they are in the url, percent encoded
 */
export function segmentValue(param: string) {
  try {
    return decodeURIComponent(param)
  } catch {
    return param
  }
}
