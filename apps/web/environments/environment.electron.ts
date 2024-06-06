import { env } from './env'
import {
  Environment,
  getModelsUrlHiRes,
  getModelsUrlLowRes,
  getModelsUrlMidRes,
  getNwDataDeployUrl,
  getWorldTilesUrl,
} from './utils'

export const environment: Environment = {
  ...env,
  production: true,
  standalone: true,
  environment: 'ELECTRON',
  modelsUrlLow: getModelsUrlLowRes(env),
  modelsUrlMid: getModelsUrlMidRes(env),
  modelsUrlHigh: getModelsUrlHiRes(env),
  nwDataUrl: getNwDataDeployUrl(env),
  worldTilesUrl: getWorldTilesUrl(env),
}
