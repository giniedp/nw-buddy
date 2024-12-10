import { env } from './env'
import { Environment, getModelsUrlHiRes, getModelsUrlLowRes, getModelsUrlMidRes, getNwDataUrl } from './utils'

export const environment: Environment = {
  ...env,
  production: true,
  standalone: true,
  environment: 'STANDALONE',
  modelsUrlLow: getModelsUrlLowRes(env, 'cdnUrl'),
  modelsUrlMid: getModelsUrlMidRes(env, 'cdnUrl'),
  modelsUrlHigh: getModelsUrlHiRes(env, 'cdnUrl'),
  nwDataUrl: getNwDataUrl(env, 'deployUrl'),
  nwImagesUrl: getNwDataUrl(env, 'deployUrl'),
  nwTilesUrl: getNwDataUrl(env, 'deployUrl'),
}
