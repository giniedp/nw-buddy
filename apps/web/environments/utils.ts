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
  cdnDataUrl: string
}

export function getModelsUrlLowRes(env: EnvVars) {
  return new URL('models-512', env.cdnUrl).toString()
}
export function getModelsUrlMidRes(env: EnvVars) {
  return new URL('models-1k', env.cdnUrl).toString()
}
export function getModelsUrlHiRes(env: EnvVars) {
  return new URL('models-2k', env.cdnUrl).toString()
}

export function getNwDataPath(version: string = null) {
  return normalizePath(`nw-data/${version || ''}`)
}

export function getNwDataDeployUrl(env: EnvVars) {
  return `${env.deployUrl}/${getNwDataPath()}`
}

export function getNwDataCdnUrl(env: EnvVars) {
  return `${env.cdnUrl}/${normalizePath(getNwDataPath(env.branchname))}`
}

function normalizePath(path: string) {
  return path.replace(/\\/gi, '/').replace(/\/+/gi, '/').replace(/\/$/, '')
}
