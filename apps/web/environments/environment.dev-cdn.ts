import { env } from './env'
import { Environment, getModelsUrlHiRes, getModelsUrlLowRes, getModelsUrlMidRes, getNwDataUrl } from './utils'

export const environment: Environment = {
  ...env,
  production: false,
  standalone: false,
  environment: 'DEV',
  modelsUrlLow: getModelsUrlLowRes(env, 'cdnUrl'),
  modelsUrlMid: getModelsUrlMidRes(env, 'cdnUrl'),
  modelsUrlHigh: getModelsUrlHiRes(env, 'cdnUrl'),
  nwDataUrl: getNwDataUrl(env, 'deployUrl'),
  nwImagesUrl: getNwDataUrl(env, 'cdnUrl'),
  nwTilesUrl: getNwDataUrl(env, 'cdnUrl'),
}
