import { env } from './env'
import { Environment, getModelsUrl, getNwDataUrl } from './utils'

export const environment: Environment = {
  ...env,
  production: true,
  standalone: true,
  environment: 'STANDALONE',
  modelsUrl: getModelsUrl(env, 'cdnUrl'),
  nwDataUrl: getNwDataUrl(env, 'deployUrl'),
  nwImagesUrl: getNwDataUrl(env, 'deployUrl'),
  nwTilesUrl: getNwDataUrl(env, 'deployUrl'),
  nwCharUrl: null,
}
