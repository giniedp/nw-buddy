import { EnvVars } from './env'

export interface Environment extends EnvVars {
  environment: string
  production: boolean
  standalone: boolean
  workspace: string
  isPTR: boolean
  version: string
  cdnUrl: string
  deployUrl: string
  modelsUrlLow: string
  modelsUrlMid: string
  modelsUrlHigh: string
  nwDataUrl: string
  nwImagesUrl: string
  nwTilesUrl: string
}

export type BaseUrl = 'cdnUrl' | 'deployUrl'

function getModelsUrl(env: EnvVars, baseUrl: BaseUrl, version: string) {
  return normalizePath(`${env[baseUrl]}/${version}`)
}

export function getModelsUrlLowRes(env: EnvVars, baseUrl: BaseUrl) {
  return getModelsUrl(env, baseUrl, 'models-512')
}
export function getModelsUrlMidRes(env: EnvVars, baseUrl: BaseUrl) {
  return getModelsUrl(env, baseUrl, 'models-1k')
}
export function getModelsUrlHiRes(env: EnvVars, baseUrl: BaseUrl) {
  return getModelsUrl(env, baseUrl, 'models-2k')
}
export function getNwDataUrl(env: EnvVars, baseUrl: BaseUrl) {
  const version = baseUrl === 'cdnUrl' ? env.branchname : null
  const nwDataPath = normalizePath(`nw-data/${version || ''}`)
  return normalizePath(`${env[baseUrl]}/${nwDataPath}`)
}

function normalizePath(path: string) {
  path = path.replace(/\\/gi, '/')
  // replace multiple slashes with a single one but keep the double slashes in the protocol
  path = path.replace(/(?<!:)\/+/gm, '/')
  path = path.replace(/\/$/, '')
  return path
}
