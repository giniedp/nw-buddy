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
}

export type BaseUrl = 'cdnUrl' | 'deployUrl'

export function getModelsUrl(env: EnvVars, baseUrl: BaseUrl) {
  return normalizePath(`${env[baseUrl]}/models`)
}

export function getNwDataUrl(env: EnvVars, baseUrl: BaseUrl) {
  const version = baseUrl === 'cdnUrl' ? env.branchname : null
  const nwDataPath = normalizePath(`nw-data/${version || ''}`)
  return normalizePath(`${env[baseUrl]}/${nwDataPath}`)
}

function normalizePath(path: string) {
  path = path.replace(/\\/gi, '/')
  // replace multiple slashes with a single one but keep the double slashes in the protocol
  path = path.replace(/([^:]?\/)\/+/gm, '/')
  path = path.replace(/\/$/, '')
  return path
}
