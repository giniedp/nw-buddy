import { env } from './env'
import { Environment, getModelsUrl, getNwDataUrl } from './utils'

export const environment: Environment = {
  ...env,
  production: true,
  standalone: false,
  environment: 'WEB',
  modelsUrl: getModelsUrl(env, 'cdnUrl'),
  nwImagesUrl: getNwDataUrl(env, 'deployUrl'),
  nwTilesUrl: getNwDataUrl(env, 'deployUrl'),
  nwDataUrl: getNwDataUrl(env, 'deployUrl'),
}
