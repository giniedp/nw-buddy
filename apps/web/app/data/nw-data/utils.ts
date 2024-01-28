import { NwDataLoader } from '@nw-data/generated'

export type ApiMethods = keyof NwDataLoader

export function apiMethodNames() {
  return Object.getOwnPropertyNames(NwDataLoader.prototype) as Array<ApiMethods>
}

export function apiMethods<K extends ApiMethods>(loader: NwDataLoader, match: (method: string) => boolean) {
  return apiMethodNames()
    .filter(match)
    .map((name) => {
      return {
        load: loader[name].bind(loader) as NwDataLoader[K],
        name: name as K,
      }
    })
}

export function apiMethodsByPrefix<K extends ApiMethods>(loader: NwDataLoader, prefix: string) {
  return apiMethodNames()
    .filter((it) => it.startsWith(prefix))
    .map((name) => {
      return {
        load: loader[name].bind(loader) as NwDataLoader[K],
        name: name as K,
        prefix: prefix,
        suffix: name.replace(prefix, ''),
      }
    })
}
