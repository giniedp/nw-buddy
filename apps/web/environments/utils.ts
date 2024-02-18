import { replace } from 'lodash'
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
  modelsUrl: string
  nwDataUrl: string
}

export function getModelsUrl(env: EnvVars) {
  return new URL('models', env.cdnUrl).toString()
}

export function getNwDataPath(version: string = null) {
  return `nw-data/${version || ''}`.replace(/\/$/, '')
}

export function getNwDataCdnUrl(env: EnvVars) {
  return new URL(getNwDataPath(), env.cdnUrl).toString()
}

export function getNwDataDeployUrl(env: EnvVars) {
  return env.deployUrl + getNwDataPath()
}
