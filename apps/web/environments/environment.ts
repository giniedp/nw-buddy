import { env } from './env'
import { Environment, getModelsUrlHiRes, getModelsUrlLowRes, getModelsUrlMidRes, getNwDataUrl } from './utils'

export const environment: Environment = {
  ...env,
  production: false,
  standalone: false,
  environment: 'LOCAL',
  modelsUrlLow: getModelsUrlLowRes(env, 'deployUrl'),
  modelsUrlMid: getModelsUrlMidRes(env, 'deployUrl'),
  modelsUrlHigh: getModelsUrlHiRes(env, 'deployUrl'),
  nwDataUrl: getNwDataUrl(env, 'deployUrl'),
  nwImagesUrl: getNwDataUrl(env, 'deployUrl'),
  nwTilesUrl: getNwDataUrl(env, 'deployUrl'),
}
