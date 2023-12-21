import { EnvVars } from "./env"

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

export function getEnvModelsUrl(env: EnvVars) {
  console.log(env)
  return new URL('models', env.cdnUrl).toString()
}

export function getEnvDataVersionPath(version: string) {
  return `nw-data/${version}`
}

export function getEnvDataPath(env: EnvVars) {
  return getEnvDataVersionPath(env.workspace || (env.isPTR ? 'ptr' : 'live'))
}

export function getEnvDataCdnUrl(env: EnvVars) {
  return new URL(getEnvDataPath(env), env.cdnUrl).toString()
}

export function getEnvDataDeployUrl(env: EnvVars) {
  return env.deployUrl + getEnvDataPath(env)
}
