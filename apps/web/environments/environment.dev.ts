import { env } from './env'
import { Environment, getNwDataDeployUrl, getModelsUrlLowRes, getModelsUrlMidRes, getModelsUrlHiRes, getWorldTilesCdnUrl } from './utils'

export const environment: Environment = {
  ...env,
  production: false,
  standalone: false,
  environment: 'DEV',
  modelsUrlLow: getModelsUrlLowRes(env),
  modelsUrlMid: getModelsUrlMidRes(env),
  modelsUrlHigh: getModelsUrlHiRes(env),
  nwDataUrl: getNwDataDeployUrl(env),
  worldTilesUrl: getWorldTilesCdnUrl(env)
}
