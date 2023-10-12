declare const __NWB_VERSION__: string
declare const __NWB_USE_PTR__: boolean
declare const __NWB_CDN_URL__: string
declare const __NWB_DEPLOY_URL__: string

export type EnvVars = typeof env
export const env = {
  /**
   * The build version string
   */
  version: __NWB_VERSION__,
  /**
   * Whether this is a New World PTR build
   */
  isPTR: __NWB_USE_PTR__,
  /**
   * The path where models are located
   */
  cdnUrl: __NWB_CDN_URL__,
  /**
   * The deploy URL for assets and resources
   */
  deployUrl: __NWB_DEPLOY_URL__,
}

export interface Environment {
  environment: string
  production: boolean
  standalone: boolean
  isPTR: boolean
  version: string
  cdnUrl: string
  deployUrl: string
  modelsUrl: string
  nwDataUrl: string
}

export function getEnvModelsUrl(env: EnvVars) {
  return new URL('models', env.cdnUrl).toString()
}

export function getEnvDataVersionPath(version: string) {
  return `nw-data/${version}`
}

export function getEnvDataPath(env: EnvVars) {
  return getEnvDataVersionPath(env.isPTR ? 'ptr' : 'live')
}

export function getEnvDataCdnUrl(env: EnvVars) {
  return new URL(getEnvDataPath(env), env.cdnUrl).toString()
}

export function getEnvDataDeployUrl(env: EnvVars) {
  return env.deployUrl + getEnvDataPath(env)
}
