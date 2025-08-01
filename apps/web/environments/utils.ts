import { EnvVars } from './env'

export interface Environment extends EnvVars {
  environment: string
  production: boolean
  standalone: boolean
  workspace: string
  isPTR: boolean
  version: string
  nwbtUrl: string
  cdnUrl: string
  deployUrl: string
  modelsUrl: string

  nwDataUrl: string
  nwImagesUrl: string
  nwTilesUrl: string
  nwCharUrl: string
}

export type BaseUrl = 'cdnUrl' | 'deployUrl'

export function getModelsUrl(env: EnvVars, baseUrl: BaseUrl) {
  return normalizePath(`${env[baseUrl]}/models`)
}

export function getCharacterUrl(env: EnvVars, baseUrl: BaseUrl) {
  return normalizePath(`${env[baseUrl]}/character`)
}

export function getNwDataUrl(env: EnvVars, baseUrl: BaseUrl) {
  const version = baseUrl === 'cdnUrl' ? env.branchname : null
  const nwDataPath = normalizePath(`nw-data/${version || ''}`)
  return normalizePath(`${env[baseUrl]}/${nwDataPath}`)
}

function normalizePath(path: string) {
  // \ -> /
  path = path.replace(/\\/gi, '/')
  // collapse multiple forward slashes, keep protocol e.g. https://, don't use lookbehind (breaks Safari)
  path = path.replace(/([^:]\/)\/+/g, '$1');
  // collapse leading forward slashes that aren't handled above
  path = path.replace(/^\/+/, '/')
  // ensure there is no trailing slash
  path = path.replace(/\/$/, '')
  return path
}
