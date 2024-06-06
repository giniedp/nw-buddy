import { env } from './env'
import {
  Environment,
  getModelsUrlHiRes,
  getModelsUrlLowRes,
  getModelsUrlMidRes,
  getNwDataDeployUrl,
  getWorldTilesCdnUrl,
} from './utils'

export const environment: Environment = {
  ...env,
  production: false,
  standalone: false,
  environment: 'LOCAL',
  modelsUrlLow: getModelsUrlLowRes(env),
  modelsUrlMid: getModelsUrlMidRes(env),
  modelsUrlHigh: getModelsUrlHiRes(env),
  nwDataUrl: getNwDataDeployUrl(env),
  worldTilesUrl: getWorldTilesCdnUrl(env),
}
