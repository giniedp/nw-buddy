import { env } from './env'
import { Environment, getModelsUrlHiRes, getModelsUrlLowRes, getModelsUrlMidRes, getNwDataUrl } from './utils'

export const environment: Environment = {
  ...env,
  production: true,
  standalone: false,
  environment: 'WEB',
  modelsUrlLow: getModelsUrlLowRes(env, 'cdnUrl'),
  modelsUrlMid: getModelsUrlMidRes(env, 'cdnUrl'),
  modelsUrlHigh: getModelsUrlHiRes(env, 'cdnUrl'),
  nwImagesUrl: getNwDataUrl(env, 'deployUrl'),
  nwTilesUrl: getNwDataUrl(env, 'deployUrl'),
  nwDataUrl: getNwDataUrl(env, 'deployUrl'),
}
